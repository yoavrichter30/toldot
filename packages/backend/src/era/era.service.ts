import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Era, EraMeta, EraConfig } from './era.types';

/** Convert a snake_case string to camelCase. */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/** Deep-camelize all keys in a parsed JSON/YAML object. */
function deepCamelize<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(deepCamelize) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamelCase(key)] = deepCamelize(value);
    }
    return result as T;
  }
  return obj as T;
}

@Injectable()
export class EraService {
  private readonly erasDir: string;

  constructor() {
    this.erasDir = path.resolve(process.cwd(), '..', '..', 'eras');
  }

  listEras(): EraMeta[] {
    if (!fs.existsSync(this.erasDir)) {
      fs.mkdirSync(this.erasDir, { recursive: true });
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
        const meta = deepCamelize<EraMeta>(raw);
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
    const meta = deepCamelize<EraMeta>(rawMeta);

    const rawConfig = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf-8'));
    const config = deepCamelize<EraConfig>(rawConfig);

    const promptTemplate = fs.readFileSync(path.join(dir, 'prompt_template.md'), 'utf-8');
    const groundingDocs = fs.readFileSync(path.join(dir, 'grounding_docs.md'), 'utf-8');

    return { meta, config, promptTemplate, groundingDocs };
  }

  getPromptTemplate(id: string): string {
    return fs.readFileSync(path.join(this.getEraDir(id), 'prompt_template.md'), 'utf-8');
  }

  getGroundingDocs(id: string): string {
    return fs.readFileSync(path.join(this.getEraDir(id), 'grounding_docs.md'), 'utf-8');
  }
}