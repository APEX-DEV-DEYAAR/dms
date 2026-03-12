-- Fill existing records with default descriptions
UPDATE letterheads 
SET description = 'Official letter regarding ' || 
    CASE 
        WHEN notes IS NOT NULL AND notes != '' 
        THEN SUBSTR(notes, 1, 50) || CASE WHEN LENGTH(notes) > 50 THEN '...' ELSE '' END
        ELSE 'department matter dated ' || letter_date
    END
WHERE description IS NULL OR description = '';

-- Update any remaining null descriptions
UPDATE letterheads 
SET description = 'Official correspondence - ' || reference_number
WHERE description IS NULL OR description = '';
