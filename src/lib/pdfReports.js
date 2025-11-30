// PDF Report Generation Utility
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSoilHealthReport = (cardData, farmerId) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(34, 197, 94); // Green
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Soil Health Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Farmer ID: ${farmerId}`, pageWidth / 2, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Farmer Details
    let yPos = 50;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Farmer Information', 14, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    const farmerInfo = [
        ['Name', cardData.farmerName],
        ['Phone', cardData.phone],
        ['Village', cardData.village],
        ['District', cardData.district],
        ['State', cardData.state],
        ['Farm Size', `${cardData.farmSize || '2.5'} acres`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: farmerInfo,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 14 }
    });

    // Soil Parameters
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Soil Health Parameters', 14, yPos);

    yPos += 10;
    const soilParams = [
        ['pH Level', cardData.ph?.toString() || 'N/A', getpHStatus(cardData.ph)],
        ['Organic Carbon (%)', cardData.organicCarbon?.toString() || 'N/A', getOCStatus(cardData.organicCarbon)],
        ['NPK Ratio', cardData.npk || 'N/A', 'Check individual nutrients'],
        ['Electrical Conductivity', cardData.ec?.toString() || 'N/A', getECStatus(cardData.ec)],
        ['Soil Texture', cardData.texture || 'N/A', '-']
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value', 'Status']],
        body: soilParams,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 }
    });

    // Recommendations
    yPos = doc.lastAutoTable.finalY + 15;

    // Add new page if needed
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Key Recommendations', 14, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    const recommendations = generateRecommendations(cardData);
    recommendations.forEach((rec, idx) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`${idx + 1}. ${rec}`, 14, yPos, { maxWidth: pageWidth - 28 });
        yPos += 7;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generated on ${new Date().toLocaleDateString()} | GreenCoders E-Soil Smart System`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10);
    }

    return doc;
};

export const generateCropAdvisoryReport = (cardData, cropRecommendations, weather, farmerId) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Crop Advisory Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Farmer ID: ${farmerId}`, pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    // Current Weather
    let yPos = 50;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Current Weather Conditions', 14, yPos);

    yPos += 10;
    if (weather) {
        const weatherInfo = [
            ['Temperature', `${weather.temp}°C`],
            ['Condition', weather.description],
            ['Humidity', `${weather.humidity}%`],
            ['Alert', weather.alert || 'None']
        ];

        autoTable(doc, {
            startY: yPos,
            body: weatherInfo,
            theme: 'plain',
            margin: { left: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Crop Recommendations
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Recommended Crops', 14, yPos);

    yPos += 10;

    const cropTable = cropRecommendations.map((rec, idx) => [
        (idx + 1).toString(),
        rec.crop,
        rec.suitabilityScore?.toFixed(1) || 'N/A',
        rec.reason?.substring(0, 60) || 'Suitable for your soil'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Crop', 'Score', 'Reason']],
        body: cropTable,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14 },
        columnStyles: {
            3: { cellWidth: 'auto' }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generated on ${new Date().toLocaleDateString()} | GreenCoders E-Soil Smart System`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    return doc;
};

export const downloadPDF = (doc, filename) => {
    doc.save(filename);
};

// Helper functions
function getpHStatus(ph) {
    if (!ph) return 'Unknown';
    if (ph < 5.5) return '❌ Too Acidic';
    if (ph < 6.5) return '⚠️ Slightly Acidic';
    if (ph <= 7.5) return '✅ Optimal';
    if (ph <= 8.5) return '⚠️ Slightly Alkaline';
    return '❌ Too Alkaline';
}

function getOCStatus(oc) {
    if (!oc) return 'Unknown';
    if (oc < 0.5) return '❌ Very Low';
    if (oc < 0.75) return '⚠️ Low';
    if (oc <= 1.5) return '✅ Good';
    return '✅ Excellent';
}

function getECStatus(ec) {
    if (!ec) return 'Unknown';
    if (ec < 1) return '✅ Normal';
    if (ec < 2) return '⚠️ Slightly Saline';
    return '❌ Saline';
}

function generateRecommendations(cardData) {
    const recs = [];

    // pH recommendations
    if (cardData.ph < 6.0) {
        recs.push('Apply lime (2-3 tons/ha) to increase soil pH and reduce acidity.');
    } else if (cardData.ph > 8.0) {
        recs.push('Apply gypsum or sulfur to reduce alkalinity and improve nutrient availability.');
    }

    // Organic carbon
    if (cardData.organicCarbon < 0.75) {
        recs.push('Increase organic matter by adding farmyard manure (10-15 tons/ha) or compost.');
        recs.push('Practice crop rotation and green manuring to build organic carbon.');
    }

    // NPK
    const [n, p, k] = (cardData.npk || '80:40:60').split(':').map(v => parseInt(v));
    if (n < 100) {
        recs.push('Apply nitrogen-rich fertilizers like urea. Consider using biofertilizers like Azotobacter.');
    }
    if (p < 50) {
        recs.push('Apply DAP or SSP for phosphorus. Use PSB biofertilizer for better phosphorus availability.');
    }
    if (k < 80) {
        recs.push('Apply MOP (Muriate of Potash) to increase potassium levels.');
    }

    // Texture-based
    if (cardData.texture === 'Sandy') {
        recs.push('Sandy soil: Increase water retention with organic matter. Irrigate more frequently.');
    } else if (cardData.texture === 'Clay') {
        recs.push('Clay soil: Improve drainage with organic amendments. Avoid over-watering.');
    }

    // General
    recs.push('Get soil tested annually to track improvements and adjust practices.');
    recs.push('Practice conservation agriculture: minimal tillage, crop residue retention, crop rotation.');

    return recs;
}
