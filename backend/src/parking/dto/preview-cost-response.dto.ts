export class PreviewCostResponseDto {
  ticketNumber: string;
  plate: string;
  entryTime: Date;
  durationMinutes: number;
  hasMonthlyPass: boolean;
  subtotal: number;
  estimatedTotal: number;
}
