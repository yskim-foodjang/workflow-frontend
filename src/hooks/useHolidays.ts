import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type { ApiResponse } from '@/types';

interface Holiday {
  date: string; // "YYYY-MM-DD"
  name: string;
}

/** year/month 에 해당하는 공휴일 배열을 가져오는 React Query 훅 */
function useHolidayList(year: number, month: number) {
  return useQuery<Holiday[]>({
    queryKey: ['holidays', year, month],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Holiday[]>>(
        `/holidays?year=${year}&month=${month}`
      );
      return data.data;
    },
    staleTime: 24 * 60 * 60_000,  // 하루 캐시
    gcTime:    7  * 24 * 60 * 60_000,
  });
}

/**
 * 주어진 연/월의 공휴일을 Map<"YYYY-MM-DD", "공휴일명"> 형태로 반환.
 * 두 달(displayMonth + selectedDate 월)을 받아 주 경계에서도 정상 표시.
 */
export function useHolidaysMap(
  year1: number, month1: number,
  year2?: number, month2?: number,
): Map<string, string> {
  const { data: list1 = [] } = useHolidayList(year1, month1);

  // 같은 월이면 두 번째 쿼리 skip
  const sameMonth = year2 === year1 && month2 === month1;
  const { data: list2 = [] } = useHolidayList(
    year2 ?? year1,
    month2 ?? month1,
  );

  return useMemo(() => {
    const map = new Map<string, string>();
    list1.forEach(h => map.set(h.date, h.name));
    if (!sameMonth) list2.forEach(h => map.set(h.date, h.name));
    return map;
  }, [list1, list2, sameMonth]);
}
