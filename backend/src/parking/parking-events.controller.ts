import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ParkingEventsService } from './parking-events.service';

/**
 * SSE endpoint for parking session change notifications.
 * No auth guard: the event payload carries no sensitive data (only the event type).
 * Data retrieval still happens through the protected REST endpoints.
 */
@Controller('parking')
export class ParkingEventsController {
  constructor(private readonly eventsService: ParkingEventsService) {}

  @Sse('events')
  stream(): Observable<MessageEvent> {
    return this.eventsService.events$;
  }
}
