import { Injectable, MessageEvent, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ParkingEventsService implements OnModuleDestroy {
  private readonly subject = new Subject<MessageEvent>();

  /** Each subscriber gets the shared subject + its own 30s heartbeat */
  get events$(): Observable<MessageEvent> {
    const heartbeat$ = interval(30_000).pipe(
      map(() => ({ data: { type: 'HEARTBEAT' } } as MessageEvent)),
    );
    return merge(this.subject.asObservable(), heartbeat$);
  }

  emit(type: string): void {
    this.subject.next({ data: { type } });
  }

  onModuleDestroy(): void {
    this.subject.complete();
  }
}
