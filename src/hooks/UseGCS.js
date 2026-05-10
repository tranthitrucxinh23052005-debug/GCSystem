import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getTierFromPoints, getTierProgress } from '@/lib/gcsEngine';

/**
 * Hook quản lý toàn bộ trạng thái GCS của người dùng
 * Giúp code ở Dashboard và Profile cực kỳ ngắn gọn
 */
export function useGCS(userEmail) {
    const { data: profiles, isLoading } = useQuery({
        queryKey: ['userProfile', userEmail],
        queryFn: () => base44.entities.UserProfile.filter({ user_email: userEmail }),
        enabled: !!userEmail,
    });

    const profile = profiles?. || {
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
        // Thêm các helper function để component gọi trực tiếp
        isLegacy: profile.tier === 'legacy',
        pointsToNext: progressData.pointsToNext
    };
}