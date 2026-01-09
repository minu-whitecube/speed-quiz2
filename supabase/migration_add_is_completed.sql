-- 기존 테이블에 is_completed 컬럼 추가 (마이그레이션용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;
