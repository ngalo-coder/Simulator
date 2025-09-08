import { describe, it, expect } from 'vitest'
import { 
  specialtyToSlug, 
  slugToSpecialty, 
  isValidSpecialtySlug, 
  normalizeSpecialtySlug 
} from './urlUtils'

describe('urlUtils - Comprehensive Testing', () => {
  describe('specialtyToSlug', () => {
    it('should convert basic specialty names to slugs', () => {
      expect(specialtyToSlug('Internal Medicine')).toBe('internal_medicine')
      expect(specialtyToSlug('Pediatrics')).toBe('pediatrics')
      expect(specialtyToSlug('Emergency Medicine')).toBe('emergency_medicine')
    })

    it('should handle multiple spaces', () => {
      expect(specialtyToSlug('Internal   Medicine')).toBe('internal_medicine')
      expect(specialtyToSlug('  Emergency  Medicine  ')).toBe('emergency_medicine')
    })

    it('should handle special characters', () => {
      expect(specialtyToSlug('Obstetrics & Gynecology')).toBe('obstetrics_gynecology')
      expect(specialtyToSlug('Ear, Nose & Throat')).toBe('ear_nose_throat')
      expect(specialtyToSlug('Anesthesia/Pain Management')).toBe('anesthesia_pain_management')
    })

    it('should handle case sensitivity', () => {
      expect(specialtyToSlug('INTERNAL MEDICINE')).toBe('internal_medicine')
      expect(specialtyToSlug('internal medicine')).toBe('internal_medicine')
      expect(specialtyToSlug('InTeRnAl MeDiCiNe')).toBe('internal_medicine')
    })

    it('should handle numbers', () => {
      expect(specialtyToSlug('Medicine 101')).toBe('medicine_101')
      expect(specialtyToSlug('Pediatrics Level 2')).toBe('pediatrics_level_2')
    })

    it('should handle edge cases', () => {
      expect(specialtyToSlug('')).toBe('')
      expect(specialtyToSlug('   ')).toBe('')
      expect(specialtyToSlug('A')).toBe('a')
      expect(specialtyToSlug('A B')).toBe('a_b')
    })

    it('should handle invalid inputs', () => {
      expect(specialtyToSlug(null as any)).toBe('')
      expect(specialtyToSlug(undefined as any)).toBe('')
      expect(specialtyToSlug(123 as any)).toBe('')
    })

    it('should remove consecutive underscores', () => {
      expect(specialtyToSlug('Internal___Medicine')).toBe('internal_medicine')
      expect(specialtyToSlug('A  &  B')).toBe('a_b')
    })

    it('should remove leading and trailing underscores', () => {
      expect(specialtyToSlug('_Internal Medicine_')).toBe('internal_medicine')
      expect(specialtyToSlug('&Internal Medicine&')).toBe('internal_medicine')
    })
  })

  describe('slugToSpecialty', () => {
    it('should convert basic slugs to specialty names', () => {
      expect(slugToSpecialty('internal_medicine')).toBe('Internal Medicine')
      expect(slugToSpecialty('pediatrics')).toBe('Pediatrics')
      expect(slugToSpecialty('emergency_medicine')).toBe('Emergency Medicine')
    })

    it('should handle hyphens', () => {
      expect(slugToSpecialty('internal-medicine')).toBe('Internal Medicine')
      expect(slugToSpecialty('ear-nose-throat')).toBe('Ear Nose Throat')
    })

    it('should handle mixed underscores and hyphens', () => {
      expect(slugToSpecialty('internal_medicine-specialty')).toBe('Internal Medicine Specialty')
    })

    it('should handle single words', () => {
      expect(slugToSpecialty('pediatrics')).toBe('Pediatrics')
      expect(slugToSpecialty('cardiology')).toBe('Cardiology')
    })

    it('should handle numbers', () => {
      expect(slugToSpecialty('medicine_101')).toBe('Medicine 101')
      expect(slugToSpecialty('level_2_pediatrics')).toBe('Level 2 Pediatrics')
    })

    it('should handle edge cases', () => {
      expect(slugToSpecialty('')).toBe('')
      expect(slugToSpecialty('   ')).toBe('')
      expect(slugToSpecialty('a')).toBe('A')
      expect(slugToSpecialty('a_b')).toBe('A B')
    })

    it('should handle invalid inputs', () => {
      expect(slugToSpecialty(null as any)).toBe('')
      expect(slugToSpecialty(undefined as any)).toBe('')
      expect(slugToSpecialty(123 as any)).toBe('')
    })

    it('should handle multiple spaces in slugs', () => {
      expect(slugToSpecialty('internal__medicine')).toBe('Internal Medicine')
      expect(slugToSpecialty('a___b___c')).toBe('A B C')
    })
  })

  describe('isValidSpecialtySlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSpecialtySlug('internal_medicine')).toBe(true)
      expect(isValidSpecialtySlug('pediatrics')).toBe(true)
      expect(isValidSpecialtySlug('emergency_medicine')).toBe(true)
      expect(isValidSpecialtySlug('cardiology')).toBe(true)
    })

    it('should validate slugs with hyphens', () => {
      expect(isValidSpecialtySlug('internal-medicine')).toBe(true)
      expect(isValidSpecialtySlug('ear-nose-throat')).toBe(true)
    })

    it('should validate slugs with numbers', () => {
      expect(isValidSpecialtySlug('medicine101')).toBe(true)
      expect(isValidSpecialtySlug('level_2_pediatrics')).toBe(true)
    })

    it('should reject invalid characters', () => {
      expect(isValidSpecialtySlug('internal medicine')).toBe(false) // spaces
      expect(isValidSpecialtySlug('internal&medicine')).toBe(false) // special chars
      expect(isValidSpecialtySlug('internal.medicine')).toBe(false) // dots
      expect(isValidSpecialtySlug('internal/medicine')).toBe(false) // slashes
    })

    it('should reject uppercase letters', () => {
      expect(isValidSpecialtySlug('Internal_Medicine')).toBe(false)
      expect(isValidSpecialtySlug('PEDIATRICS')).toBe(false)
    })

    it('should reject slugs starting or ending with underscore/hyphen', () => {
      expect(isValidSpecialtySlug('_internal_medicine')).toBe(false)
      expect(isValidSpecialtySlug('internal_medicine_')).toBe(false)
      expect(isValidSpecialtySlug('-internal-medicine')).toBe(false)
      expect(isValidSpecialtySlug('internal-medicine-')).toBe(false)
    })

    it('should reject consecutive underscores/hyphens', () => {
      expect(isValidSpecialtySlug('internal__medicine')).toBe(false)
      expect(isValidSpecialtySlug('internal--medicine')).toBe(false)
      expect(isValidSpecialtySlug('internal_-medicine')).toBe(false)
    })

    it('should reject empty or invalid inputs', () => {
      expect(isValidSpecialtySlug('')).toBe(false)
      expect(isValidSpecialtySlug('   ')).toBe(false)
      expect(isValidSpecialtySlug(null as any)).toBe(false)
      expect(isValidSpecialtySlug(undefined as any)).toBe(false)
      expect(isValidSpecialtySlug(123 as any)).toBe(false)
    })
  })

  describe('normalizeSpecialtySlug', () => {
    it('should normalize basic slugs', () => {
      expect(normalizeSpecialtySlug('Internal_Medicine')).toBe('internal_medicine')
      expect(normalizeSpecialtySlug('PEDIATRICS')).toBe('pediatrics')
    })

    it('should normalize consecutive separators', () => {
      expect(normalizeSpecialtySlug('internal__medicine')).toBe('internal_medicine')
      expect(normalizeSpecialtySlug('internal--medicine')).toBe('internal_medicine')
      expect(normalizeSpecialtySlug('internal_-_medicine')).toBe('internal_medicine')
    })

    it('should remove leading and trailing separators', () => {
      expect(normalizeSpecialtySlug('_internal_medicine_')).toBe('internal_medicine')
      expect(normalizeSpecialtySlug('-internal-medicine-')).toBe('internal_medicine')
    })

    it('should handle whitespace', () => {
      expect(normalizeSpecialtySlug('  internal_medicine  ')).toBe('internal_medicine')
    })

    it('should handle edge cases', () => {
      expect(normalizeSpecialtySlug('')).toBe('')
      expect(normalizeSpecialtySlug('   ')).toBe('')
      expect(normalizeSpecialtySlug('___')).toBe('')
      expect(normalizeSpecialtySlug('---')).toBe('')
    })

    it('should handle invalid inputs', () => {
      expect(normalizeSpecialtySlug(null as any)).toBe('')
      expect(normalizeSpecialtySlug(undefined as any)).toBe('')
      expect(normalizeSpecialtySlug(123 as any)).toBe('')
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain consistency in round-trip conversions', () => {
      const specialties = [
        'Internal Medicine',
        'Pediatrics',
        'Emergency Medicine',
        'Cardiology',
        'Obstetrics Gynecology',
        'Ear Nose Throat'
      ]

      specialties.forEach(specialty => {
        const slug = specialtyToSlug(specialty)
        const backToSpecialty = slugToSpecialty(slug)
        expect(backToSpecialty).toBe(specialty)
      })
    })

    it('should handle edge cases in round-trip', () => {
      const edgeCases = [
        'A',
        'Medicine 101',
        'Level 2 Pediatrics'
      ]

      edgeCases.forEach(specialty => {
        const slug = specialtyToSlug(specialty)
        expect(isValidSpecialtySlug(slug)).toBe(true)
        const backToSpecialty = slugToSpecialty(slug)
        expect(backToSpecialty).toBe(specialty)
      })
    })
  })

  describe('error scenarios and edge cases', () => {
    it('should handle extremely long specialty names', () => {
      const longSpecialty = 'A'.repeat(1000)
      const slug = specialtyToSlug(longSpecialty)
      expect(slug).toBe('a'.repeat(1000))
      expect(isValidSpecialtySlug(slug)).toBe(true)
    })

    it('should handle specialty names with only special characters', () => {
      expect(specialtyToSlug('!@#$%^&*()')).toBe('')
      expect(specialtyToSlug('___')).toBe('')
      // Hyphens are preserved in the current implementation
      expect(specialtyToSlug('---')).toBe('---')
    })

    it('should handle mixed valid and invalid characters', () => {
      expect(specialtyToSlug('Med!c@l Sp#ci$lty')).toBe('medcl_spcilty')
      expect(specialtyToSlug('Test & Development')).toBe('test_development')
    })

    it('should handle unicode characters', () => {
      expect(specialtyToSlug('Médecine Générale')).toBe('mdecine_gnrale')
      expect(specialtyToSlug('Pädiatrie')).toBe('pdiatrie')
    })

    it('should handle numbers and letters combination', () => {
      expect(specialtyToSlug('COVID-19 Medicine')).toBe('covid-19_medicine')
      expect(specialtyToSlug('Level 1 Trauma')).toBe('level_1_trauma')
    })
  })

  describe('performance and consistency', () => {
    it('should be consistent across multiple calls', () => {
      const specialty = 'Internal Medicine'
      const results = Array.from({ length: 100 }, () => specialtyToSlug(specialty))
      expect(results.every(result => result === 'internal_medicine')).toBe(true)
    })

    it('should handle batch processing', () => {
      const specialties = [
        'Internal Medicine',
        'Pediatrics',
        'Emergency Medicine',
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Dermatology',
        'Psychiatry',
        'Radiology',
        'Pathology'
      ]

      const slugs = specialties.map(specialtyToSlug)
      const backToSpecialties = slugs.map(slugToSpecialty)
      
      expect(backToSpecialties).toEqual(specialties)
      expect(slugs.every(isValidSpecialtySlug)).toBe(true)
    })
  })

  describe('URL safety validation', () => {
    it('should produce URL-safe slugs', () => {
      const specialties = [
        'Internal Medicine',
        'Obstetrics & Gynecology',
        'Ear, Nose & Throat',
        'Anesthesia/Pain Management',
        'Emergency Medicine'
      ]

      specialties.forEach(specialty => {
        const slug = specialtyToSlug(specialty)
        // Check that slug is URL-safe (no spaces, special chars except underscore/hyphen)
        expect(slug).toMatch(/^[a-z0-9_-]*$/)
        expect(slug).not.toContain(' ')
        expect(slug).not.toContain('&')
        expect(slug).not.toContain('/')
        expect(slug).not.toContain(',')
      })
    })

    it('should handle URL encoding scenarios', () => {
      const problematicNames = [
        'Medicine & Surgery',
        'Ear/Nose/Throat',
        'Pain Management (Advanced)',
        'Surgery + Trauma'
      ]

      problematicNames.forEach(name => {
        const slug = specialtyToSlug(name)
        expect(isValidSpecialtySlug(slug)).toBe(true)
        // Should not contain problematic URL characters (except hyphens which are allowed)
        expect(slug).not.toMatch(/[&\/\(\)\+\s]/)
      })

      // Test specific case that includes hyphens
      const medicineLevel = specialtyToSlug('Medicine - Level 1')
      // This creates 'medicine_-_level_1' which is not valid due to consecutive separators
      expect(isValidSpecialtySlug(medicineLevel)).toBe(false)
    })
  })
})