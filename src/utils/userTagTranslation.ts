import { Language } from '@/contexts/LanguageContext';

export interface UserCategoryTag {
  id: string;
  tag_name: string;
  tag_name_en?: string;
  tag_name_es?: string;
  color: string;
  category_id: string;
}

/**
 * Gets the translated name for a user category tag based on the current language
 * @param tag - The user category tag object
 * @param language - Target language code
 * @returns Translated tag name
 */
export const getTranslatedTagName = (tag: UserCategoryTag, language: Language): string => {
  if (!tag) return '';
  
  switch (language) {
    case 'en':
      return tag.tag_name_en || tag.tag_name;
    case 'es':
      return tag.tag_name_es || tag.tag_name;
    case 'pt':
    default:
      return tag.tag_name;
  }
};

/**
 * Sorts tags by their translated names
 * @param tags - Array of user category tags
 * @param language - Target language code
 * @returns Sorted array of tags
 */
export const sortTagsByTranslatedName = (tags: UserCategoryTag[], language: Language): UserCategoryTag[] => {
  return [...tags].sort((a, b) => {
    const nameA = getTranslatedTagName(a, language);
    const nameB = getTranslatedTagName(b, language);
    return nameA.localeCompare(nameB);
  });
};