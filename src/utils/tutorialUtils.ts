import jsPDF from 'jspdf';

export const downloadTutorialPDF = async () => {
  try {
    // Fetch the tutorial HTML
    const response = await fetch('/tutorial-couples-financials.html');
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
    const lineHeight = 8;
    let currentY = margin;
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tutorial Completo - Couples Financials', margin, currentY);
    currentY += 15;
    
    // Add content sections
    const sections = tempDiv.querySelectorAll('section');
    
    sections.forEach((section) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      
      // Add section title
      const title = section.querySelector('h2, h3');
      if (title) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.textContent || '', margin, currentY);
        currentY += 10;
      }
      
      // Add section content
      const paragraphs = section.querySelectorAll('p, li');
      paragraphs.forEach((p) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const text = p.textContent || '';
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        lines.forEach((line: string) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });
        
        currentY += 3; // Extra spacing between paragraphs
      });
      
      currentY += 8; // Extra spacing between sections
    });
    
    // Download the PDF
    pdf.save('couples-financials-tutorial.pdf');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: open HTML in new tab
    window.open('/tutorial-couples-financials.html', '_blank');
  }
};

export const openTutorialHTML = () => {
  window.open('/tutorial-couples-financials.html', '_blank');
};