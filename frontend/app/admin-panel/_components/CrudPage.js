'use client';
/**
 * CrudPage — componente genérico para las páginas de gestión CRUD del admin.
 * Soporta: listar, crear, editar y eliminar cualquier recurso de la API.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function CrudPage({
    title,
    endpoint,
    columns,       // [{key, label, render?}]
    fields,        // [{key, label, type, required?, options?, placeholder?}]
    defaultValues, // valores iniciales del formulario
    transform,     // fn(item) => item modificado para mostrar
    extraActions,  // fn(item) => JSX — botones extra por fila (antes de Editar/Eliminar)
}) {
    const { authFetch } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | 'edit'
    const [current, setCurrent] = useState(defaultValues || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.results ?? []);
                setItems(transform ? list.map(transform) : list);
            }
        } finally {
            setLoading(false);
        }
    }, [authFetch, endpoint, transform]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setCurrent(defaultValues || {});
        setError('');
        setModal('create');
    };

    const openEdit = (item) => {
        setCurrent({ ...item });
        setError('');
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setError(''); };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const isEdit = modal === 'edit';
            const url = isEdit ? `${endpoint}${current.id}/` : endpoint;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await authFetch(url, { method, body: JSON.stringify(current) });
            if (res.ok) {
                closeModal();
                await load();
            } else {
                const errData = await res.json();
                const msg = Object.values(errData).flat().join(' ');
                setError(msg || 'Error al guardar');
            }
        } catch (_) {
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
        await authFetch(`${endpoint}${id}/`, { method: 'DELETE' });
        await load();
    };

    const handleField = (key, value) => setCurrent(prev => ({ ...prev, [key]: value }));

    return (
        <div className="admin-content">
            {/* Toolbar */}
            <div className="table-toolbar">
                <h2>{title} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({items.length})</span></h2>
                <button className="btn btn-primary" onClick={openCreate}>＋ Nuevo</button>
            </div>

            {/* Tabla */}
            {loading ? (
                <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>Cargando…</p>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📭</div>
                    <p>Sin registros. Crea el primero.</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    {columns.map(col => (
                                        <td key={col.key}>
                                            {col.render ? col.render(item) : (item[col.key] ?? '—')}
                                        </td>
                                    ))}
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {extraActions && extraActions(item)}
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑 Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Create/Edit */}
            {modal && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{modal === 'create' ? `Nuevo — ${title}` : `Editar — ${title}`}</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                            {fields.map(field => (
                                <div key={field.key} className="form-group">
                                    <label className="form-label">
                                        {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select
                                            className="form-select"
                                            value={current[field.key] ?? ''}
                                            onChange={e => handleField(field.key, e.target.value)}
                                        >
                                            <option value="">— Seleccionar —</option>
                                            {(field.options || []).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea
                                            className="form-textarea"
                                            value={current[field.key] ?? ''}
                                            onChange={e => handleField(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                        />
                                    ) : field.type === 'checkbox' ? (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={!!current[field.key]}
                                                onChange={e => handleField(field.key, e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{field.checkLabel || 'Activo'}</span>
                                        </label>
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            className="form-input"
                                            value={current[field.key] ?? ''}
                                            onChange={e => handleField(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
