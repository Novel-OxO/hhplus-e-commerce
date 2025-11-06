/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅합니다.
 *
 * @param date 포맷팅할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 *
 * @example
 * formatDate(new Date('2024-01-05')) // '2024-01-05'
 * formatDate(new Date('2024-12-25')) // '2024-12-25'
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * N일 전 날짜를 반환합니다.
 *
 * @param days 며칠 전인지 지정 (양수)
 * @returns N일 전의 날짜 객체
 *
 * @example
 * getDateDaysAgo(1)  // 어제
 * getDateDaysAgo(7)  // 일주일 전
 * getDateDaysAgo(30) // 한 달 전
 */
export function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
