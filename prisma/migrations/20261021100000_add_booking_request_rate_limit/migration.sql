-- Slice K (K.10): a booking request needs its own rate-limit bucket,
-- separate from JOIN_REQUEST — additive, existing rows/values untouched.

-- AlterEnum
ALTER TYPE "rate_limit_action" ADD VALUE 'BOOKING_REQUEST';
