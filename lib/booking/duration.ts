/** Minutes between two instants (K.17, K.22): a booking's length. */
export function bookingDurationMinutes(startsAt: Date, endsAt: Date): number {
  return (endsAt.getTime() - startsAt.getTime()) / 60_000;
}
