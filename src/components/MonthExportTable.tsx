import { forwardRef } from 'react';
import { DailyTask } from '@/types/schedule';

interface MonthExportTableProps {
  tasks: DailyTask[];
  monthNumber: number;
}

const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const hijriMonths = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
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

export const MonthExportTable = forwardRef<HTMLDivElement, MonthExportTableProps>(
  ({ tasks, monthNumber }, ref) => {
    const getDayName = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', { weekday: 'long' });
    };

    const formatPages = (pages: number[]) => {
      if (pages.length === 0) return '-';
      if (pages.length === 1) return `ص${pages[0]}`;
      return `ص${pages[0]} - ${pages[pages.length - 1]}`;
    };

    // تقسيم المهام إلى أسابيع
    const weeks: DailyTask[][] = [];
    for (let i = 0; i < tasks.length; i += 7) {
      weeks.push(tasks.slice(i, i + 7));
    }

    const startDate = tasks[0]?.date ? formatGregorianDate(tasks[0].date) : '';
    const endDate = tasks[tasks.length - 1]?.date ? formatGregorianDate(tasks[tasks.length - 1].date) : '';

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          fontFamily: '"Amiri", "Traditional Arabic", "Arabic Typesetting", serif',
          backgroundColor: '#ffffff',
          padding: '30px',
          width: '1400px',
          minHeight: '900px',
        }}
      >
        {/* العنوان الرئيسي */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#1a5f4a',
            marginBottom: '12px',
            fontFamily: '"Amiri", serif',
          }}>
            جدول حفظ القرآن الكريم
          </h1>
          <p style={{ fontSize: '22px', color: '#333', fontFamily: '"Amiri", serif', marginBottom: '8px' }}>
            الشهر {monthNumber}
          </p>
          <p style={{ fontSize: '16px', color: '#666', fontFamily: '"Amiri", serif' }}>
            من {startDate} إلى {endDate}
          </p>
        </div>

        {/* فهرس الأسابيع */}
        <div style={{ 
          marginBottom: '40px', 
          padding: '20px', 
          backgroundColor: '#f0f7f4',
          borderRadius: '12px',
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1a5f4a',
            marginBottom: '16px',
            textAlign: 'center',
            fontFamily: '"Amiri", serif',
          }}>
            فهرس الأسابيع
          </h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            flexWrap: 'wrap' 
          }}>
            {weeks.map((week, index) => {
              const weekStart = week[0]?.date ? formatGregorianDate(week[0].date) : '';
              const weekEnd = week[week.length - 1]?.date ? formatGregorianDate(week[week.length - 1].date) : '';
              const newPages = week.reduce((acc, t) => acc + t.newMemorization.pages.length, 0);
              
              return (
                <div key={index} style={{
                  padding: '12px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '2px solid #1a5f4a',
                  textAlign: 'center',
                  minWidth: '200px',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a5f4a', marginBottom: '4px' }}>
                    الأسبوع {index + 1}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    {weekStart} - {weekEnd}
                  </div>
                  <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: 'bold' }}>
                    {newPages} صفحة حفظ جديد
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* جداول الأسابيع - كل أسبوع في صفحة منفصلة */}
        {weeks.map((weekTasks, weekIndex) => (
          <div 
            key={weekIndex} 
            style={{ 
              marginBottom: '50px',
              pageBreakAfter: 'always',
              pageBreakInside: 'avoid',
            }}
            className="week-page"
          >
            {/* عنوان الأسبوع */}
            <div style={{ 
              backgroundColor: '#1a5f4a', 
              color: '#ffffff', 
              padding: '12px 20px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                fontFamily: '"Amiri", serif',
                margin: 0,
              }}>
                الأسبوع {weekIndex + 1}
              </h3>
              <span style={{ fontSize: '14px' }}>
                {weekTasks[0]?.date ? formatGregorianDate(weekTasks[0].date) : ''} - {weekTasks[weekTasks.length - 1]?.date ? formatGregorianDate(weekTasks[weekTasks.length - 1].date) : ''}
              </span>
            </div>

            {/* الجدول */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e8f5e9', color: '#1a5f4a' }}>
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
                {weekTasks.map((task, index) => (
                  <tr 
                    key={task.date}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                    }}
                  >
                    <td style={tdStyle}>
                      <strong style={{ fontSize: '14px' }}>{getDayName(task.date)}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: '#888' }}>يوم {task.dayNumber}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {formatGregorianDate(task.date)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {formatHijriDate(task.date)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold', color: '#1a5f4a', fontSize: '13px' }}>
                        {task.newMemorization.surahName}
                      </div>
                      {task.newMemorization.unitLabel && (
                        <div style={{ fontSize: '12px', color: '#444' }}>{task.newMemorization.unitLabel}</div>
                      )}
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatPages(task.newMemorization.pages)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '13px' }}>
                        {task.nearReview.surahName}
                      </div>
                      {task.nearReview.unitLabel && (
                        <div style={{ fontSize: '12px', color: '#444' }}>{task.nearReview.unitLabel}</div>
                      )}
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatPages(task.nearReview.pages)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold', color: '#1565c0', fontSize: '13px' }}>
                        الجزء {task.farReview.juzNumber}
                      </div>
                      {task.farReview.unitLabel && (
                        <div style={{ fontSize: '12px', color: '#444' }}>{task.farReview.unitLabel}</div>
                      )}
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatPages(task.farReview.pages)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 'bold' }}>
                        {task.tomorrowPreparation.description || "القراءة والاستماع"}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatPages(task.tomorrowPreparation.pages)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12px', color: '#0369a1' }}>
                        {task.weeklyPreparation?.description || "التحضير للأسبوع القادم"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ملخص الأسبوع */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f5f5f5',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center',
              borderTop: '2px solid #1a5f4a',
            }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f4a' }}>
                  {weekTasks.reduce((acc, t) => acc + t.newMemorization.pages.length, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>صفحات جديدة</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
                  {weekTasks.reduce((acc, t) => acc + t.nearReview.pages.length, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>مراجعة قريبة</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>
                  {weekTasks.reduce((acc, t) => acc + t.farReview.pages.length, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>مراجعة بعيدة</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#b45309' }}>
                  {weekTasks.reduce((acc, t) => 
                    acc + t.newMemorization.pages.length + t.nearReview.pages.length + t.farReview.pages.length, 0
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>إجمالي الصفحات</div>
              </div>
            </div>
          </div>
        ))}

        {/* ملخص الشهر الكامل */}
        <div style={{ 
          marginTop: '30px', 
          padding: '24px', 
          backgroundColor: '#1a5f4a',
          borderRadius: '12px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {tasks.reduce((acc, t) => acc + t.newMemorization.pages.length, 0)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>صفحات جديدة</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {tasks.reduce((acc, t) => acc + t.nearReview.pages.length, 0)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>مراجعة قريبة</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {tasks.reduce((acc, t) => acc + t.farReview.pages.length, 0)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>مراجعة بعيدة</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {tasks.reduce((acc, t) => 
                acc + t.newMemorization.pages.length + t.nearReview.pages.length + t.farReview.pages.length, 0
              )}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>إجمالي الصفحات</div>
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

MonthExportTable.displayName = 'MonthExportTable';

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  border: '1px solid #1a5f4a',
  fontSize: '13px',
  fontFamily: '"Amiri", serif',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 6px',
  textAlign: 'center',
  border: '1px solid #ddd',
  verticalAlign: 'middle',
  fontFamily: '"Amiri", serif',
};