import { forwardRef } from 'react';
import {
  DailyMuslimGoal, DailyMuslimDayProgress, PRAYER_SECTIONS,
} from '@/types/dailyMuslim';

interface Props {
  goals: DailyMuslimGoal[];
  dates: string[]; // ISO YYYY-MM-DD list (1, 7, or 30)
  getDayProgress: (dateKey: string) => DailyMuslimDayProgress;
  title?: string;
}

const formatArabicDate = (iso: string) => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

export const DailyMuslimExportTable = forwardRef<HTMLDivElement, Props>(
  ({ goals, dates, getDayProgress, title = 'متتبع يوم المسلم' }, ref) => {
    const cellBase: React.CSSProperties = {
      border: '1px solid #c8d6cf',
      padding: '6px 4px',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontFamily: '"Amiri", "Traditional Arabic", serif',
      fontSize: '13px',
    };
    const headerCell: React.CSSProperties = {
      ...cellBase,
      backgroundColor: '#1a5f4a',
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: '11px',
      padding: '10px 6px',
      verticalAlign: 'middle',
      minWidth: '34px',
    };
    // Sub-column (goal) headers — lighter background, more padding, vertically centered
    const subHeaderCell: React.CSSProperties = {
      ...cellBase,
      backgroundColor: '#ddf0e9',  // close to dayCell (#f0f7f4) but with a hint of green
      color: '#1a5f4a',
      fontWeight: 'bold',
      fontSize: '11px',
      padding: '10px 6px',
      verticalAlign: 'middle',
      minWidth: '34px',
    };
    const dayCell: React.CSSProperties = {
      ...cellBase,
      backgroundColor: '#f0f7f4',
      fontWeight: 'bold',
      color: '#1a5f4a',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      padding: '6px 8px',
    };
    const sectionHeader: React.CSSProperties = {
      ...headerCell,
      backgroundColor: '#0f4438',
      fontSize: '12px',
    };

    // group goals by section in defined order
    const goalsBySection = PRAYER_SECTIONS.map(sec => ({
      section: sec,
      items: goals.filter(g => g.sectionId === sec.id).sort((a, b) => a.order - b.order),
    })).filter(s => s.items.length > 0);

    const orderedGoals = goalsBySection.flatMap(s => s.items);

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          fontFamily: '"Amiri", "Traditional Arabic", "Arabic Typesetting", serif',
          backgroundColor: '#ffffff',
          padding: '30px',
          width: '1400px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a5f4a', marginBottom: '6px' }}>﷽</h1>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a5f4a', marginBottom: '4px' }}>{title}</h2>
          <p style={{ fontSize: '15px', color: '#666' }}>﴿ وَأَنِ اعْبُدُونِي ۚ هَٰذَا صِرَاطٌ مُّسْتَقِيمٌ ﴾</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', marginBottom: '14px', fontSize: '15px', color: '#1a5f4a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>الاسم:</span>
            <div style={{ borderBottom: '1.5px solid #1a5f4a', width: '220px', height: '22px' }} />
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {dates.length === 1 ? formatArabicDate(dates[0]) :
              `${formatArabicDate(dates[0])}  →  ${formatArabicDate(dates[dates.length - 1])}`}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...headerCell, minWidth: '90px', fontSize: '13px' }}>اليوم</th>
              {goalsBySection.map(s => (
                <th key={s.section.id} colSpan={s.items.length} style={sectionHeader}>
                  <div style={{ fontSize: '14px' }}>{s.section.icon} {s.section.name}</div>
                </th>
              ))}
              <th rowSpan={2} style={{ ...headerCell, minWidth: '50px', fontSize: '12px' }}>الإنجاز</th>
            </tr>
            <tr>
              {orderedGoals.map(g => (
                <th key={g.id} style={subHeaderCell}>
                  <div style={{ fontSize: '15px', marginBottom: '4px' }}>{g.icon}</div>
                  <div style={{ fontSize: '10px', lineHeight: '1.3' }}>{g.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((dateKey, idx) => {
              const dayProg = getDayProgress(dateKey);
              const completed = orderedGoals.filter(g => dayProg[g.id]).length;
              const isComplete = completed === orderedGoals.length && orderedGoals.length > 0;
              const pct = orderedGoals.length > 0 ? Math.round((completed / orderedGoals.length) * 100) : 0;
              return (
                <tr key={dateKey} style={{
                  backgroundColor: isComplete ? '#e8f5e9' : idx % 2 === 0 ? '#fafafa' : '#ffffff',
                }}>
                  <td style={dayCell}>{formatArabicDate(dateKey)}</td>
                  {orderedGoals.map(g => {
                    const checked = !!dayProg[g.id];
                    return (
                      <td key={g.id} style={{
                        ...cellBase,
                        backgroundColor: checked ? '#e8f5e9' : 'transparent',
                        height: '38px',
                      }}>
                        {checked ? (
                          <span style={{ fontSize: '20px' }}>✅</span>
                        ) : (
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            border: '2px solid #ccc', margin: '0 auto',
                          }} />
                        )}
                      </td>
                    );
                  })}
                  <td style={{
                    ...cellBase, fontWeight: 'bold',
                    color: isComplete ? '#1a5f4a' : pct > 50 ? '#2e7d32' : '#b45309',
                    fontSize: '12px',
                  }}>
                    {pct > 0 ? `${pct}%` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
          تم التصدير من تطبيق متتبع يوم المسلم
        </div>
      </div>
    );
  }
);

DailyMuslimExportTable.displayName = 'DailyMuslimExportTable';
