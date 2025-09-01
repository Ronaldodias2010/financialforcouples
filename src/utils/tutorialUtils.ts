import jsPDF from 'jspdf';

type Language = 'pt' | 'en' | 'es';

// Sanitize text for jsPDF (remove emojis and unsupported chars, normalize quotes/bullets)
const sanitizeText = (input: string): string => {
  if (!input) return '';
  let text = input
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}]/gu, '') // remove emojis
    .replace(/\u2022/g, '-') // bullet • to -
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/\u00A0/g, ' '); // non-breaking space
  // Remove any remaining unsupported unicode (> 255)
  text = Array.from(text).map(ch => ch.charCodeAt(0) > 255 ? '' : ch).join('');
  return text.trim();
};

export const downloadTutorialPDF = async (language: Language = 'pt') => {
  try {
    // SEMPRE usar o arquivo principal completo (1348 linhas) para garantir conteúdo completo
    const tutorialUrl = `/tutorial-couples-financials.html`;
    const response = await fetch(tutorialUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch tutorial: ${response.status}`);
    }
    const htmlContent = await response.text();
    
    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set up basic styling
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 6;
    let currentY = margin;
    
    // Language-specific titles
    const titles = {
      pt: 'Tutorial Completo - Couples Financials',
      en: 'Complete Tutorial - Couples Financials',
      es: 'Tutorial Completo - Couples Financials'
    };
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titles[language], margin, currentY);
    currentY += 15;
    
    // Capturar TODO o conteúdo da div.container, não apenas seções
    const container = tempDiv.querySelector('.container') || tempDiv;
    const allContent = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, div.feature-card, div.step, div.tip-box');
    
    allContent.forEach((element) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }
      
      const tagName = element.tagName.toLowerCase();
      const textContent = sanitizeText(element.textContent || '');
      
      if (!textContent.trim()) return; // Skip empty elements
      
      // Handle different element types
      if (tagName === 'h1') {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        currentY += 8;
      } else if (tagName === 'h2') {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        currentY += 6;
      } else if (tagName === 'h3') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        currentY += 4;
      } else if (tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        currentY += 3;
      } else if (tagName === 'li') {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        // Add bullet point
        const bulletText = `• ${textContent}`;
        const lines = pdf.splitTextToSize(bulletText, pageWidth - 2 * margin - 5);
        lines.forEach((line: string, index: number) => {
          if (currentY > pageHeight - 15) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin + (index === 0 ? 0 : 5), currentY);
          currentY += lineHeight;
        });
        currentY += 2;
        return;
      } else {
        // Regular paragraphs and other content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }
      
      // Split text to fit page width
      const lines = pdf.splitTextToSize(textContent, pageWidth - 2 * margin);
      
      lines.forEach((line: string) => {
        if (currentY > pageHeight - 15) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += (tagName.startsWith('h') ? lineHeight + 1 : lineHeight);
      });
      
      // Add extra spacing after headers
      if (tagName.startsWith('h')) {
        currentY += 4;
      } else {
        currentY += 2;
      }
    });
    
    // Download the PDF with language suffix
    const fileName = `couples-financials-tutorial-${language}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: open HTML in new tab
    openTutorialHTML(language);
  }
};

export const openTutorialHTML = (language: Language = 'pt') => {
  // Construct the tutorial URL based on language
  const tutorialUrl = `/tutorial-couples-financials-${language}.html`;
  
  console.log('[Tutorial] Attempting to open:', tutorialUrl);
  
  // Try to open the language-specific tutorial file directly
  // The file exists in public folder, so it should be accessible
  try {
    const newTab = window.open(tutorialUrl, '_blank');
    if (!newTab) {
      console.warn('[Tutorial] Popup blocked, trying fallback');
      // If popup is blocked, try the main tutorial file
      window.open('/tutorial-couples-financials.html', '_blank');
    }
  } catch (error) {
    console.error('[Tutorial] Error opening tutorial:', error);
    // Fallback to main tutorial file
    window.open('/tutorial-couples-financials.html', '_blank');
  }
};