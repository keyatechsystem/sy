class AnalyticsSystem {
    constructor() { this.cache = {}; this.reports = []; }

    getStartDate(period) {
        const now = new Date();
        switch(period) {
            case 'day': now.setHours(0,0,0,0); return now;
            case 'week': now.setDate(now.getDate() - 7); return now;
            case 'month': now.setMonth(now.getMonth() - 1); return now;
            case 'year': now.setFullYear(now.getFullYear() - 1); return now;
            default: now.setMonth(now.getMonth() - 1); return now;
        }
    }

    async analyzeCustomerSatisfaction(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            const snapshot = await db.collection('tickets').where('closedAt', '>=', startDate).where('feedback', '!=', null).get();
            let totalRating = 0; let ratings = { 1:0, 2:0, 3:0, 4:0, 5:0 };
            snapshot.forEach(doc => {
                const ticket = doc.data();
                if (ticket.feedback?.rating) {
                    const rating = ticket.feedback.rating;
                    totalRating += rating;
                    ratings[rating]++;
                }
            });
            const averageRating = snapshot.size > 0 ? (totalRating / snapshot.size).toFixed(1) : 0;
            return { period, totalFeedbacks: snapshot.size, averageRating, ratings };
        } catch (error) { console.error('Error analyzing satisfaction:', error); return null; }
    }

    async analyzeTickets(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            const snapshot = await db.collection('tickets').where('createdAt', '>=', startDate).get();
            const analysis = {
                total: 0, byStatus: { open:0, 'in-progress':0, closed:0 },
                byPriority: { low:0, medium:0, high:0, urgent:0 },
                byDay: {}, byHour: Array(24).fill(0),
                averageResolution: 0, totalResolutionTime: 0
            };
            snapshot.forEach(doc => {
                const ticket = doc.data();
                analysis.total++;
                analysis.byStatus[ticket.status || 'open']++;
                analysis.byPriority[ticket.priority || 'medium']++;
                if (ticket.createdAt) {
                    const date = ticket.createdAt.toDate().toLocaleDateString('ar-EG');
                    analysis.byDay[date] = (analysis.byDay[date] || 0) + 1;
                    analysis.byHour[ticket.createdAt.toDate().getHours()]++;
                    if (ticket.status === 'closed' && ticket.closedAt) {
                        const duration = (ticket.closedAt.toDate() - ticket.createdAt.toDate()) / (1000 * 60 * 60);
                        analysis.totalResolutionTime += duration;
                    }
                }
            });
            analysis.averageResolution = analysis.byStatus.closed > 0 ? (analysis.totalResolutionTime / analysis.byStatus.closed).toFixed(1) : 0;
            return analysis;
        } catch (error) { console.error('Error analyzing tickets:', error); return null; }
    }
}

const analyticsSystem = new AnalyticsSystem();
