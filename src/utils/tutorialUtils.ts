import jsPDF from 'jspdf';

type Language = 'pt' | 'en' | 'es';

export const downloadTutorialPDF = async (language: Language = 'pt') => {
  try {
    // Fetch the tutorial HTML based on language
    const tutorialUrl = `/tutorial-couples-financials-${language}.html`;
    const response = await fetch(tutorialUrl);
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
    
    // Add content sections - Fixed: use .section instead of section
    const sections = tempDiv.querySelectorAll('.section');
    
    sections.forEach((section) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      
      // Add section title
      const title = section.querySelector('h2');
      if (title) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const titleText = title.textContent || '';
        const titleLines = pdf.splitTextToSize(titleText, pageWidth - 2 * margin);
        titleLines.forEach((line: string) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 8;
        });
        currentY += 5;
      }
      
      // Add subsection titles
      const subtitles = section.querySelectorAll('h3');
      subtitles.forEach((subtitle) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const subtitleText = subtitle.textContent || '';
        const subtitleLines = pdf.splitTextToSize(subtitleText, pageWidth - 2 * margin);
        subtitleLines.forEach((line: string) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 7;
        });
        currentY += 3;
      });
      
      // Add section content
      const paragraphs = section.querySelectorAll('p');
      paragraphs.forEach((p) => {
        if (currentY > pageHeight - 25) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const text = p.textContent || '';
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        lines.forEach((line: string) => {
          if (currentY > pageHeight - 15) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });
        
        currentY += 3; // Extra spacing between paragraphs
      });
      
      // Add list items
      const listItems = section.querySelectorAll('li');
      listItems.forEach((li) => {
        if (currentY > pageHeight - 25) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const text = `• ${li.textContent || ''}`;
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        lines.forEach((line: string) => {
          if (currentY > pageHeight - 15) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin + 5, currentY);
          currentY += lineHeight;
        });
        
        currentY += 2; // Extra spacing between list items
      });
      
      currentY += 10; // Extra spacing between sections
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
  const tutorialUrl = `/tutorial-couples-financials-${language}.html`;
  window.open(tutorialUrl, '_blank');
};