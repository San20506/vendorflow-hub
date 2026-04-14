-- Add deletion_reason column to deleted_records_history
ALTER TABLE deleted_records_history
ADD COLUMN deletion_reason TEXT;

-- Add comment for clarity
COMMENT ON COLUMN deleted_records_history.deletion_reason IS 'Optional reason for deletion (e.g., Duplicate, Discontinued, Error, Other)';

-- Create index on deletion_reason for filtering (if needed later)
CREATE INDEX idx_deleted_records_history_reason ON deleted_records_history(deletion_reason);
