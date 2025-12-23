'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortablePhotoItem({ id, url }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative cursor-move touch-none hover:shadow-lg transition-shadow"
        >
            <img
                src={url}
                alt="Preview"
                className="w-full h-full object-cover pointer-events-none"
            />
        </div>
    );
}

export default function PhotosManager() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        isPaid: false,
        price: 0
    });
    const [files, setFiles] = useState([]); // Array of { id, file, preview }
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const toast = useToast();

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            const res = await fetch('/api/photos?limit=100');
            if (res.ok) {
                const data = await res.json();
                setPhotos(data.photos || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (editingId) {
            // Edit mode - single file
            const f = e.target.files[0];
            if (f) {
                setFile(f);
                setPreview(URL.createObjectURL(f));
            }
        } else {
            // Batch mode
            if (e.target.files && e.target.files.length > 0) {
                const selected = Array.from(e.target.files);
                if (selected.length > 20) {
                    toast.error('Maximum 20 photos allowed at once');
                    return;
                }

                // Wrap files with unique ID for dnd-kit
                const filesWithId = selected.map(file => ({
                    id: nanoid(),
                    file,
                    preview: URL.createObjectURL(file)
                }));

                setFiles(filesWithId);
                setFile(null);
                setPreview(null);
            }
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!form.title && !editingId) return toast.error('Title is required');

        if (editingId) {
            if (!file && !form.url) return toast.error('Image is required');
        } else {
            if (files.length === 0) return toast.error('Please select photos');
        }

        setUploading(true);
        const token = localStorage.getItem('accessToken');

        try {
            if (editingId) {
                // --- UPDATE SINGLE PHOTO ---
                let url = form.url;

                // 1. Upload if file exists
                if (file) {
                    const signRes = await fetch('/api/upload/sign?resource_type=image', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!signRes.ok) throw new Error('Failed to sign upload');
                    const sig = await signRes.json();

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('api_key', sig.apiKey);
                    formData.append('timestamp', sig.timestamp);
                    formData.append('signature', sig.signature);
                    if (sig.folder) formData.append('folder', sig.folder);

                    const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
                        method: 'POST', body: formData
                    });
                    if (!upRes.ok) throw new Error('Upload failed');
                    const upData = await upRes.json();
                    url = upData.secure_url;
                }

                // 2. Update Photo
                const res = await fetch(`/api/photos/${editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...form,
                        url,
                        price: parseFloat(form.price) * 100 // Convert to cents
                    })
                });

                if (!res.ok) throw new Error('Failed to update photo');
                toast.success('Photo updated');

            } else {
                // --- ALBUM UPLOAD ---
                const albumUrls = [];

                // Upload all files in correct sorted order
                for (let i = 0; i < files.length; i++) {
                    const currentFile = files[i].file; // Access .file property specifically

                    // 1. Sign
                    const signRes = await fetch('/api/upload/sign?resource_type=image', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!signRes.ok) throw new Error('Failed to sign upload');
                    const sig = await signRes.json();

                    // 2. Upload
                    const formData = new FormData();
                    formData.append('file', currentFile);
                    formData.append('api_key', sig.apiKey);
                    formData.append('timestamp', sig.timestamp);
                    formData.append('signature', sig.signature);
                    if (sig.folder) formData.append('folder', sig.folder);

                    const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
                        method: 'POST', body: formData
                    });

                    if (!upRes.ok) {
                        toast.error(`Upload failed for image ${i + 1}`);
                        continue;
                    }

                    const upData = await upRes.json();
                    albumUrls.push(upData.secure_url);
                }

                if (albumUrls.length === 0) throw new Error('No images uploaded');

                // 3. Create SINGLE Record (Album)
                const res = await fetch('/api/photos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...form,
                        title: form.title,
                        url: albumUrls[0], // First image is cover
                        album: albumUrls,  // All images in album order
                        price: parseFloat(form.price) * 100
                    })
                });

                if (!res.ok) throw new Error('Failed to create album');
                toast.success(`Album created with ${albumUrls.length} photos!`);
            }

            closeModal();
            fetchPhotos();

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/photos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Deleted');
                setPhotos(prev => prev.filter(p => p._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (err) {
            toast.error('Error deleting');
        }
    };

    const openEdit = (photo) => {
        setEditingId(photo._id);
        setForm({
            title: photo.title,
            description: photo.description || '',
            isPaid: photo.isPaid,
            price: photo.price / 100, // Cents to Unit
            url: photo.url
        });
        setPreview(photo.url);
        setFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm({ title: '', description: '', isPaid: false, price: 0 });
        setFile(null);
        setFiles([]);
        setPreview(null);
        setEditingId(null);
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Photo
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="pb-3 pl-2">Photo</th>
                                <th className="pb-3">Details</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {photos.slice((currentPage - 1) * 8, currentPage * 8).map(photo => (
                                <tr key={photo._id} className="hover:bg-gray-50/50">
                                    <td className="py-4 pl-2">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <p className="font-semibold text-gray-900">{photo.title}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{photo.description}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <span>❤️ {photo.likesCount || 0}</span>
                                            <span>👁️ {photo.views || 0}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        {photo.isPaid ? (
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                                                VIP {(photo.price / 100).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">FREE</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-right pr-2 space-x-2">
                                        <button onClick={() => openEdit(photo)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(photo._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {photos.length === 0 && (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">No photos found</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {Math.ceil(photos.length / 8) > 1 && (
                        <div className="flex justify-between items-center mt-4 px-2 border-t border-gray-100 pt-4">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{((currentPage - 1) * 8) + 1}</span> to <span className="font-medium">{Math.min(currentPage * 8, photos.length)}</span> of <span className="font-medium">{photos.length}</span> photos
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Previous
                                </button>
                                <div className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
                                    {currentPage} / {Math.ceil(photos.length / 8)}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(photos.length / 8)))}
                                    disabled={currentPage === Math.ceil(photos.length / 8)}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${currentPage === Math.ceil(photos.length / 8) ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                                <h3 className="font-bold text-gray-900">{editingId ? 'Edit Photo' : 'Add New Photo'}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 pt-6">
                                        <input
                                            type="checkbox"
                                            id="isPaid"
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            checked={form.isPaid}
                                            onChange={e => setForm({ ...form, isPaid: e.target.checked })}
                                        />
                                        <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Premium (VIP)</label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            disabled={!form.isPaid}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                            value={form.price}
                                            onChange={e => setForm({ ...form, price: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image(s)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple={!editingId}
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />

                                    {/* Preview for Single (Edit) */}
                                    {preview && editingId && (
                                        <div className="mt-4 w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    )}

                                    {/* Preview for Grid (Batch - Sortable) */}
                                    {!editingId && files.length > 0 && (
                                        <div className="mt-4">
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={files}
                                                    strategy={rectSortingStrategy}
                                                >
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {files.map((file) => (
                                                            <SortablePhotoItem
                                                                key={file.id}
                                                                id={file.id}
                                                                url={file.preview}
                                                            />
                                                        ))}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                            <p className="text-xs text-center text-gray-400 mt-2">
                                                Drag images to reorder
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                        disabled={uploading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                                    >
                                        {uploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        {editingId ? 'Update Photo' : 'Upload Photos'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
