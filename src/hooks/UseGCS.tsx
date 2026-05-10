import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getTierFromPoints, getTierProgress } from '@/lib/gcsEngine';

/**
 * Hook quản lý toàn bộ trạng thái GCS của người dùng
 */
export function useGCS(userEmail: string | undefined) {
    const { data: profiles, isLoading } = useQuery({
        queryKey: ['userProfile', userEmail],
        queryFn: async () => {
            const result = await base44.entities.UserProfile.filter({ user_email: userEmail });
            return result;
        },
        enabled: !!userEmail,
    });

    // Ép kiểu profiles thành any để tránh lỗi TypeScript khi truy cập index
    const profile = (profiles as any)[0] || {
        total_gcs: 0,
        available_gcs: 0,
        tier: 'seed',
        tree_progress: 0,
    };

    const currentTier = getTierFromPoints(profile.total_gcs);
    const progressData = getTierProgress(profile.total_gcs);

    return {
        profile,
        currentTier,
        progressData,
        isLoading,
        isLegacy: profile.tier === 'legacy',
        pointsToNext: progressData.pointsToNext
    };
}