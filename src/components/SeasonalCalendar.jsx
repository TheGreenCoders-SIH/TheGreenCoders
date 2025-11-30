// Seasonal Advisory Calendar Component
import React from 'react';
import { Calendar } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

const monthlyAdvisories = {
    0: { // January
        activities: ['Wheat harvesting preparation', 'Mustard care', 'Vegetable planting'],
        weather: 'Cool and dry',
        priority: 'high'
    },
    1: { // February
        activities: ['Wheat irrigation', 'Summer crop planning', 'Soil testing'],
        weather: 'Warming up',
        priority: 'medium'
    },
    2: { // March
        activities: ['Wheat harvesting', 'Rice nursery preparation', 'Summer vegetable sowing'],
        weather: 'Warm',
        priority: 'high'
    },
    3: { // April
        activities: ['Rice transplanting preparation', 'Mango care', 'Mulching'],
        weather: 'Hot',
        priority: 'medium'
    },
    4: { // May
        activities: ['Rice sowing', 'Irrigation management', 'Pest monitoring'],
        weather: 'Very hot',
        priority: 'high'
    },
    5: { // June
        activities: ['Monsoon preparation', 'Rice transplanting', 'Drainage management'],
        weather: 'Monsoon onset',
        priority: 'high'
    },
    6: { // July
        activities: ['Kharif crop care', 'Weeding', 'Fertilizer application'],
        weather: 'Heavy rains',
        priority: 'high'
    },
    7: { // August
        activities: ['Pest and disease control', 'Top dressing', 'Water logging prevention'],
        weather: 'Rainy',
        priority: 'high'
    },
    8: { // September
        activities: ['Kharif harvesting prep', 'Drainage maintenance', 'Rabi planning'],
        weather: 'Reducing rainfall',
        priority: 'medium'
    },
    9: { // October
        activities: ['Rice harvesting', 'Wheat sowing preparation', 'Soil preparation'],
        weather: 'Post-monsoon',
        priority: 'high'
    },
    10: { // November
        activities: ['Wheat sowing', 'Vegetable planting', 'Irrigation setup'],
        weather: 'Cool',
        priority: 'high'
    },
    11: { // December
        activities: ['Wheat care', 'Winter vegetable management', 'Harvest planning'],
        weather: 'Cold',
        priority: 'medium'
    }
};

export default function SeasonalCalendar() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const getNext6Months = () => {
        const months = [];
        for (let i = 0; i < 6; i++) {
            const date = addMonths(currentDate, i);
            const monthIndex = date.getMonth();
            months.push({
                date,
                monthIndex,
                advisory: monthlyAdvisories[monthIndex]
            });
        }
        return months;
    };

    const months = getNext6Months();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Seasonal Farming Calendar</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {months.map((month, idx) => {
                    const isCurrentMonth = idx === 0;
                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 transition-all ${isCurrentMonth
                                    ? 'bg-green-50 border-green-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 hover:border-green-300'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-lg font-bold ${isCurrentMonth ? 'text-green-700' : 'text-gray-800'}`}>
                                    {format(month.date, 'MMMM yyyy')}
                                </h3>
                                {isCurrentMonth && (
                                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                                        NOW
                                    </span>
                                )}
                            </div>

                            <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-500 mb-1">WEATHER</div>
                                <div className="text-sm text-gray-700">{month.advisory.weather}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-gray-500 mb-2">KEY ACTIVITIES</div>
                                <ul className="space-y-1">
                                    {month.advisory.activities.map((activity, i) => (
                                        <li key={i} className="flex items-start text-xs text-gray-700">
                                            <span className="text-green-600 mr-1">●</span>
                                            <span>{activity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${month.advisory.priority === 'high'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {month.advisory.priority === 'high' ? '🔴 Critical Period' : '🔵 Moderate Activity'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Planning Tip</h4>
                <p className="text-sm text-blue-700">
                    This calendar shows the next 6 months of farming activities. Red months indicate critical periods requiring immediate attention.
                    Review upcoming activities and prepare resources in advance for better yields.
                </p>
            </div>
        </div>
    );
}
