import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { EraService } from '../era/era.service';
import { SessionService } from '../session/session.service';
import { DMOrchestratorService } from '../dm/dm-orchestrator.service';

@Controller('api')
export class GameController {
  constructor(
    private eraService: EraService,
    private sessionService: SessionService,
    private dmOrchestrator: DMOrchestratorService,
  ) {}

  @Get('eras')
  listEras() {
    return this.eraService.listEras();
  }

  @Post('session')
  createSession(@Body() body: { eraId: string }) {
    if (!body.eraId) throw new NotFoundException('eraId is required');
    const era = this.eraService.loadEra(body.eraId);
    const session = this.sessionService.createSession(body.eraId);
    return { session, goal: era.meta.goal, objectives: era.meta.objectives };
  }

  @Get('sessions')
  listSessions() {
    return this.sessionService.listSessions();
  }

  @Get('session/:id')
  getSession(@Param('id') id: string) {
    const session = this.sessionService.getSession(id);
    return { session };
  }

  @Post('turn')
  async processTurn(@Body() body: { sessionId: string; action: string }) {
    if (!body.sessionId || !body.action) {
      throw new NotFoundException('sessionId and action are required');
    }
    const session = this.sessionService.getSession(body.sessionId);
    if (session.status !== 'active') {
      throw new Error('Game is over');
    }

    const result = await this.dmOrchestrator.processTurn(body.action, session);

    // Update session
    session.state = result.newState;
    session.currentTurn = result.turnNumber;
    session.date = result.newState.date;
    if (result.gameOver) {
      session.status = result.grade || 'bronze';
    }

    this.sessionService.updateSession(session);

    const eraMeta = this.eraService.loadEra(session.eraId).meta;
    this.sessionService.logTurn({
      sessionId: session.id,
      turnNumber: result.turnNumber,
      playerAction: body.action,
      dmNarration: result.narration,
      stateSnapshot: result.newState,
      effectsApplied: result.effectsApplied,
      effectsRejected: result.effectsRejected,
      createdAt: new Date().toISOString(),
    });

    return {
      turn: result.turnNumber,
      date: result.newState.date,
      narration: result.narration,
      effectsApplied: result.effectsApplied,
      effectsRejected: result.effectsRejected,
      events: result.spawnedEvents,
      historicalNotes: result.historicalNotes,
      state: {
        resources: result.newState.resources,
        foundationTracks: result.newState.foundationTracks,
        locations: result.newState.locations,
        cohorts: result.newState.cohorts,
        projects: result.newState.projects,
      },
      gameOver: result.gameOver,
      grade: result.grade,
      maxTurns: eraMeta.maxTurns,
      goal: eraMeta.goal,
      objectives: eraMeta.objectives,
    };
  }
}
