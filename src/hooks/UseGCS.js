import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getTierFromPoints, getTierProgress } from '@/lib/gcsEngine';

export function useGCS(userEmail) {
    const { data: profiles, isLoading } = useQuery({
        queryKey: ['userProfile', userEmail],
        queryFn: () => base44.entities.UserProfile.filter({ user_email: userEmail }),
        enabled: !!userEmail,
    });

    // Sửa lỗi cú pháp ?. và đảm bảo không bị crash nếu không có profiles
    const profile = (profiles && profiles) || {
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
        pointsToNext: progressData?.pointsToNext || 0
    };
}