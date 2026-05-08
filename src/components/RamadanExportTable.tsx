import { forwardRef } from 'react';
import { RamadanGoal, RamadanDayProgress, RECITATION_UNIT_OPTIONS } from '@/types/ramadan';

interface RamadanExportTableProps {
  enabledGoals: RamadanGoal[];
  getDayProgress: (dayKey: string) => RamadanDayProgress;
}

export const RamadanExportTable = forwardRef<HTMLDivElement, RamadanExportTableProps>(
  ({ enabledGoals, getDayProgress }, ref) => {

    const getRecitationLabel = (goal: RamadanGoal) => {
      if (goal.id !== 'quranRecitation' || !goal.dailyAmount) return '';
      const unitLabel = RECITATION_UNIT_OPTIONS.find(o => o.value === goal.recitationUnit)?.label || 'صفحات';
      return `${goal.dailyAmount} ${unitLabel}`;
    };

    // Calculate totals per goal
    const goalTotals = enabledGoals.map(goal => {
      let completed = 0;
      for (let d = 1; d <= 30; d++) {
        if (getDayProgress(`day-${d}`)[goal.id]) completed++;
      }
      return completed;
    });

    const totalCompleted = goalTotals.reduce((a, b) => a + b, 0);
    const totalGoals = enabledGoals.length * 30;

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
      fontSize: '12px',
      padding: '10px 4px',
      writingMode: 'horizontal-tb',
      minWidth: '36px',
    };

    const dayCell: React.CSSProperties = {
      ...cellBase,
      backgroundColor: '#f0f7f4',
      fontWeight: 'bold',
      color: '#1a5f4a',
      fontSize: '14px',
      whiteSpace: 'nowrap',
      padding: '6px 10px',
    };

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          fontFamily: '"Amiri", "Traditional Arabic", "Arabic Typesetting", serif',
          backgroundColor: '#ffffff',
          padding: '30px',
          width: '1200px',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1a5f4a',
            marginBottom: '8px',
            fontFamily: '"Amiri", serif',
          }}>
            ﷽
          </h1>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a5f4a',
            marginBottom: '6px',
            fontFamily: '"Amiri", serif',
          }}>
            متتبع رمضان المبارك
          </h2>
          <p style={{ fontSize: '16px', color: '#666', fontFamily: '"Amiri", serif' }}>
            ﴿ شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ ﴾
          </p>
        </div>

        {/* Name field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          marginBottom: '16px',
          fontFamily: '"Amiri", serif',
          fontSize: '16px',
          color: '#1a5f4a',
        }}>
          <span style={{ fontWeight: 'bold' }}>الاسم:</span>
          <div style={{
            borderBottom: '1.5px solid #1a5f4a',
            width: '250px',
            height: '24px',
          }} />
        </div>

        {/* Main Table: goals as columns, days as rows */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          direction: 'rtl',
        }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, minWidth: '70px', fontSize: '14px' }}>اليوم</th>
              {enabledGoals.map(goal => (
                <th key={goal.id} style={headerCell}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{goal.icon}</div>
                  <div style={{ fontSize: '11px', lineHeight: '1.3' }}>{goal.label}</div>
                  {goal.id === 'quranRecitation' && (
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                      {getRecitationLabel(goal)}
                    </div>
                  )}
                </th>
              ))}
              <th style={{ ...headerCell, minWidth: '50px', fontSize: '12px' }}>الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const dayKey = `day-${day}`;
              const dayProg = getDayProgress(dayKey);
              const completed = enabledGoals.filter(g => dayProg[g.id]).length;
              const isComplete = completed === enabledGoals.length;
              const pct = enabledGoals.length > 0 ? Math.round((completed / enabledGoals.length) * 100) : 0;

              return (
                <tr key={day} style={{
                  backgroundColor: isComplete ? '#e8f5e9' : day % 2 === 0 ? '#fafafa' : '#ffffff',
                }}>
                  <td style={dayCell}>
                    {day}
                  </td>
                  {enabledGoals.map(goal => {
                    const checked = !!dayProg[goal.id];
                    return (
                      <td key={goal.id} style={{
                        ...cellBase,
                        backgroundColor: checked ? '#e8f5e9' : 'transparent',
                        height: '40px',
                      }}>
                        {checked ? (
                          <span style={{ fontSize: '22px', lineHeight: '1' }}>✅</span>
                        ) : (
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: '2px solid #ccc',
                            margin: '0 auto',
                          }} />
                        )}
                      </td>
                    );
                  })}
                  <td style={{
                    ...cellBase,
                    fontWeight: 'bold',
                    color: isComplete ? '#1a5f4a' : pct > 50 ? '#2e7d32' : '#b45309',
                    fontSize: '12px',
                  }}>
                    {pct > 0 ? `${pct}%` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#1a5f4a' }}>
              <td style={{ ...cellBase, color: '#fff', fontWeight: 'bold', fontSize: '13px', backgroundColor: '#1a5f4a' }}>
                المجموع
              </td>
              {enabledGoals.map((_, i) => (
                <td key={i} style={{ ...cellBase, backgroundColor: '#1a5f4a', padding: '6px 8px' }}>
                  <div style={{
                    width: '36px',
                    height: '20px',
                    border: '1.5px solid rgba(255,255,255,0.6)',
                    borderRadius: '3px',
                    margin: '0 auto',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }} />
                </td>
              ))}
              <td style={{ ...cellBase, backgroundColor: '#1a5f4a', padding: '6px 8px' }}>
                <div style={{
                  width: '36px',
                  height: '20px',
                  border: '1.5px solid rgba(255,255,255,0.6)',
                  borderRadius: '3px',
                  margin: '0 auto',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }} />
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#888',
          fontFamily: '"Amiri", serif',
        }}>
          تم التصدير من تطبيق متتبع رمضان
        </div>
      </div>
    );
  }
);

RamadanExportTable.displayName = 'RamadanExportTable';
