-- ==================
-- Function: sanitize_text
-- ==================
CREATE OR REPLACE FUNCTION sanitize_text(input TEXT)
RETURNS TEXT AS $$
DECLARE
    sanitized TEXT;
BEGIN
    IF input IS NULL THEN
        RETURN NULL;
    END IF;

    sanitized := TRIM(input);

    sanitized := REGEXP_REPLACE(
        sanitized,
        '[\x01-\x08\x0B\x0C\x0E-\x1F]',
        '',
        'g'
    );

    RETURN sanitized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;