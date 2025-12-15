/**
 * useFilterVideos Hook
 * Manages video filtering state and API calls
 */

import { useState, useEffect } from 'react';

export function useFilterVideos(initialFilters = {}) {
    const [filters, setFilters] = useState({
        category: initialFilters.category || '',
        isPaid: initialFilters.isPaid || '',
        minPrice: initialFilters.minPrice || '',
        maxPrice: initialFilters.maxPrice || '',
        minDuration: initialFilters.minDuration || '',
        maxDuration: initialFilters.maxDuration || '',
        sort: initialFilters.sort || 'newest',
        search: initialFilters.search || '',
        page: 1,
        limit: 20,
    });

    const [videos, setVideos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build query string
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`/api/videos?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }

            const data = await response.json();
            setVideos(data.videos || []);
            setPagination(data.pagination || null);
            setLoading(false);

        } catch (err) {
            console.error('Error fetching videos:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [filters]);

    const updateFilters = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1, // Reset to page 1 when other filters change
        }));
    };

    const goToPage = (page) => {
        setFilters(prev => ({
            ...prev,
            page: page,
        }));
    };

    const resetFilters = () => {
        setFilters({
            category: '',
            isPaid: '',
            minPrice: '',
            maxPrice: '',
            minDuration: '',
            maxDuration: '',
            sort: 'newest',
            search: '',
            page: 1,
            limit: 20,
        });
    };

    return {
        filters,
        videos,
        categories,
        loading,
        error,
        pagination,
        updateFilters,
        goToPage,
        resetFilters,
        refetch: fetchVideos,
    };
}
