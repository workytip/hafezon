import { forwardRef } from 'react';
import { DailyTask } from '@/types/schedule';

interface TaskCompletion {
  newMemorization: boolean;
  nearReview: boolean;
  farReview: boolean;
  preparation: boolean;
  weeklyPreparation: boolean;
}

interface ExportTableProps {
  tasks: DailyTask[];
  weekNumber: number;
  getDailyProgress?: (date: string) => TaskCompletion;
}

const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const formatGregorianDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatHijriDate = (dateString: string) => {
  const date = new Date(dateString);
  try {
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return hijriFormatter.format(date);
  } catch {
    return '';
  }
};

const Circle = ({ done }: { done: boolean }) => (
  <div style={{
    width: '16px', height: '16px', borderRadius: '50%',
    backgroundColor: done ? '#1a5f4a' : '#d9d9d9',
    display: 'inline-block', verticalAlign: 'middle', marginLeft: '5px', flexShrink: 0,
  }} />
);

export const ExportTable = forwardRef<HTMLDivElement, ExportTableProps>(
  ({ tasks, weekNumber, getDailyProgress }, ref) => {
    const getDayName = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', { weekday: 'long' });
    };

    const formatPages = (pages: number[]) => {
      if (pages.length === 0) return '-';
      if (pages.length === 1) return `ص${pages[0]}`;
      return `ص${pages[0]} - ${pages[pages.length - 1]}`;
    };
    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          fontFamily: '"Amiri", "Traditional Arabic", "Arabic Typesetting", serif',
          backgroundColor: '#ffffff',
          padding: '40px',
          width: '1400px',
          minHeight: '900px',
        }}
      >
        {/* العنوان */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1a5f4a',
            marginBottom: '12px',
            fontFamily: '"Amiri", serif',
          }}>
            جدول حفظ القرآن الكريم
          </h1>
          <p style={{ fontSize: '20px', color: '#666', fontFamily: '"Amiri", serif' }}>
            الأسبوع {weekNumber}
          </p>
        </div>

        {/* الجدول */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '16px',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1a5f4a', color: '#ffffff' }}>
              <th style={thStyle}>اليوم</th>
              <th style={thStyle}>التاريخ</th>
              <th style={thStyle}>الحفظ الجديد</th>
              <th style={thStyle}>المراجعة القريبة</th>
              <th style={thStyle}>المراجعة البعيدة</th>
              <th style={thStyle}>تحضير الغد</th>
              <th style={thStyle}>التحضير الأسبوعي</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const prog = getDailyProgress ? getDailyProgress(task.date) : null;
              return (
                  <tr
                    key={task.date}
                    style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff' }}
                  >
                    <td style={tdStyle}>
                      <strong style={{ fontSize: '16px' }}>{getDayName(task.date)}</strong>
                      <br />
                      <span style={{ fontSize: '14px', color: '#888' }}>يوم {task.dayNumber}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                        {formatGregorianDate(task.date)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {formatHijriDate(task.date)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Circle done={!!prog?.newMemorization} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#1a5f4a', fontSize: '15px' }}>{task.newMemorization.surahName}</div>
                          {task.newMemorization.unitLabel && <div style={{ fontSize: '14px', color: '#444' }}>{task.newMemorization.unitLabel}</div>}
                          <div style={{ fontSize: '13px', color: '#888' }}>{formatPages(task.newMemorization.pages)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Circle done={!!prog?.nearReview} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '15px' }}>{task.nearReview.surahName}</div>
                          {task.nearReview.unitLabel && <div style={{ fontSize: '14px', color: '#444' }}>{task.nearReview.unitLabel}</div>}
                          <div style={{ fontSize: '13px', color: '#888' }}>{formatPages(task.nearReview.pages)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Circle done={!!prog?.farReview} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#1565c0', fontSize: '15px' }}>الجزء {task.farReview.juzNumber}</div>
                          {task.farReview.unitLabel && <div style={{ fontSize: '14px', color: '#444' }}>{task.farReview.unitLabel}</div>}
                          <div style={{ fontSize: '13px', color: '#888' }}>{formatPages(task.farReview.pages)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Circle done={!!prog?.preparation} />
                        <div>
                          <div style={{ fontSize: '14px', color: '#6b21a8', fontWeight: 'bold' }}>{task.tomorrowPreparation.description || "القراءة والاستماع"}</div>
                          <div style={{ fontSize: '13px', color: '#888' }}>{formatPages(task.tomorrowPreparation.pages)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Circle done={!!prog?.weeklyPreparation} />
                        <div style={{ fontSize: '14px', color: '#0369a1' }}>{task.weeklyPreparation?.description || "التحضير للأسبوع القادم"}</div>
                      </div>
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>

        {/* ملخص */}
        <div style={{ 
          marginTop: '30px', 
          padding: '24px', 
          backgroundColor: '#f0f7f4',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f4a' }}>
              {tasks.reduce((acc, t) => acc + t.newMemorization.pages.length, 0)}
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>صفحات جديدة</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>
              {tasks.reduce((acc, t) => acc + t.nearReview.pages.length, 0)}
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>مراجعة قريبة</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1565c0' }}>
              {tasks.reduce((acc, t) => acc + t.farReview.pages.length, 0)}
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>مراجعة بعيدة</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6b21a8' }}>
              {tasks.reduce((acc, t) => acc + t.tomorrowPreparation.pages.length, 0)}
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>صفحات التحضير</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>
              {tasks.reduce((acc, t) => 
                acc + t.newMemorization.pages.length + t.nearReview.pages.length + t.farReview.pages.length, 0
              )}
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>إجمالي الصفحات</div>
          </div>
        </div>

        {/* تذييل */}
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: '#888',
          fontFamily: '"Amiri", serif'
        }}>
          تم التصدير من تطبيق حفظ القرآن الكريم
        </div>
      </div>
    );
  }
);

ExportTable.displayName = 'ExportTable';

const thStyle: React.CSSProperties = {
  padding: '16px 12px',
  textAlign: 'center',
  fontWeight: 'bold',
  border: '2px solid #1a5f4a',
  fontSize: '16px',
  fontFamily: '"Amiri", serif',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 10px',
  textAlign: 'center',
  border: '1px solid #ddd',
  verticalAlign: 'middle',
  fontFamily: '"Amiri", serif',
};
