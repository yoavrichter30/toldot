import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Era, EraMeta, EraConfig, EventTemplate } from './era.types';
import { EraValidatorService } from './era-validator.service';

@Injectable()
export class EraService {
  private readonly erasDir: string;

  constructor(private readonly validator: EraValidatorService) {
    this.erasDir = this.findErasDir();
  }

  /** Locate the repo-root `eras/` directory by walking up from __dirname
   *  (works both from compiled `dist/src/era` and from `src/era` under ts-jest). */
  private findErasDir(): string {
    let dir = path.resolve(__dirname);
    while (dir !== path.parse(dir).root) {
      const candidate = path.join(dir, 'eras');
      if (fs.existsSync(candidate)) return candidate;
      dir = path.dirname(dir);
    }
    return path.join(dir, 'eras');
  }

  /** Convert a snake_case string to camelCase. */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  /** Deep-camelize all keys in a parsed JSON/YAML object. */
  private deepCamelize<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.deepCamelize(v)) as T;
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[this.toCamelCase(key)] = this.deepCamelize(value);
      }
      return result as T;
    }
    return obj as T;
  }

  /** Deep-camelize an event template while preserving effect-target keys (snake_case, as consumed by the effect system). */
  private camelizeEventTemplate(raw: Record<string, unknown>): EventTemplate {
    // Camelize top-level fields (trigger_date → triggerDate) and choice fields
    const camelized = this.deepCamelize<Record<string, unknown>>(raw);
    // Preserve effects keys as authored (snake_case), matching the LLM effect-target vocabulary
    camelized.choices = ((raw.choices || []) as Array<Record<string, unknown>>).map((rawChoice, i) => ({
      ...(camelized.choices as Array<Record<string, unknown>>)[i] as Record<string, unknown>,
      effects: rawChoice.effects || {},
    }));
    return camelized as unknown as EventTemplate;
  }

  listEras(): EraMeta[] {
    if (!fs.existsSync(this.erasDir)) {
      return [];
    }
    const entries = fs.readdirSync(this.erasDir, { withFileTypes: true });
    const eras: EraMeta[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const eraPath = path.join(this.erasDir, entry.name);
      const yamlPath = path.join(eraPath, 'era.yaml');
      if (!fs.existsSync(yamlPath)) continue;
      try {
        const raw = yaml.load(fs.readFileSync(yamlPath, 'utf-8'));
        const meta = this.deepCamelize<EraMeta>(raw);
        if (meta && meta.id) eras.push(meta);
      } catch {
        /* skip invalid era dirs */
      }
    }
    return eras;
  }

  getEraDir(id: string): string {
    return path.join(this.erasDir, id);
  }

  loadEra(id: string): Era {
    const dir = this.getEraDir(id);
    if (!fs.existsSync(dir)) throw new NotFoundException(`Era "${id}" not found`);

    const rawMeta = yaml.load(fs.readFileSync(path.join(dir, 'era.yaml'), 'utf-8'));
    const meta = this.deepCamelize<EraMeta>(rawMeta);

    const rawConfig = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf-8'));
    const config = this.deepCamelize<EraConfig>(rawConfig);

    const promptTemplate = fs.readFileSync(path.join(dir, 'prompt_template.md'), 'utf-8');
    const groundingDocs = fs.readFileSync(path.join(dir, 'grounding_docs.md'), 'utf-8');

    // Optionally load scripted events; absent file is fine (empty list)
    const eventsPath = path.join(dir, 'events.json');
    let events: EventTemplate[] = [];
    if (fs.existsSync(eventsPath)) {
      const rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
      events = (rawEvents.events || []).map((e: Record<string, unknown>) => this.camelizeEventTemplate(e));
    }

    const era: Era = { meta, config, promptTemplate, groundingDocs, events };

    const metaErrors = this.validator.validateMeta(meta);
    const configErrors = this.validator.validateConfig(config);
    const allErrors = [...metaErrors, ...configErrors];
    if (allErrors.length > 0) {
      throw new Error(`Era "${id}" validation failed: ${allErrors.join('; ')}`);
    }

    return era;
  }

  getPromptTemplate(id: string): string {
    const dir = this.getEraDir(id);
    if (!fs.existsSync(dir)) throw new NotFoundException(`Era "${id}" not found`);
    return fs.readFileSync(path.join(dir, 'prompt_template.md'), 'utf-8');
  }

  getGroundingDocs(id: string): string {
    const dir = this.getEraDir(id);
    if (!fs.existsSync(dir)) throw new NotFoundException(`Era "${id}" not found`);
    return fs.readFileSync(path.join(dir, 'grounding_docs.md'), 'utf-8');
  }
}