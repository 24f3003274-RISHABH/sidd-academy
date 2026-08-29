import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../../api/courseApi';
import { formatPrice, debounce } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiSearch, FiClock, FiBook, FiStar, FiFilter, FiArrowRight } from 'react-icons/fi';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCourses = async (query = '', lvl = '', pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 9 };
      if (query) params.search = query;
      if (lvl) params.level = lvl;
      
      const res = await getAllCourses(params);
      const data = res.data?.data || res.data || {};
      const list = data.courses || [];
      setCourses(list);
      setPage(data.page || pg);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total !== undefined ? data.total : list.length);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(search, level, page);
  }, [page]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    debouncedSearch(val, level);
  };

  const debouncedSearch = debounce((s, l) => {
    fetchCourses(s, l, 1);
  }, 400);

  const handleLevelChange = (e) => {
    const val = e.target.value;
    setLevel(val);
    setPage(1);
    fetchCourses(search, val, 1);
  };

  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setPage(1);
    fetchCourses('', '', 1);
  };

  return (
    <div className="container" style={{ padding: '3.5rem 0 5rem 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <FiBook /> ACADEMIC PROGRAMS & COURSES
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Explore All Courses</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px' }}>
          Comprehensive curricula designed by top educators for Classes 9 through 12, Board examination preparation, and competitive foundation.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="card-glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by course title or topic..." 
                className="form-input" 
                style={{ paddingLeft: '2.75rem', width: '100%' }}
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select className="form-select" onChange={handleLevelChange} value={level} style={{ width: '100%' }}>
                <option value="">All Academic Levels</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
                <option value="Foundation">Foundation</option>
                <option value="Advanced">Advanced</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
              </select>
            </div>
          </div>
          {(search || level) && (
            <button onClick={clearFilters} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader />
        </div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '16px' }}>
              <FiFilter style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Courses Found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                We could not find any courses matching "{search || level}". Try searching for another subject or clear active filters.
              </p>
              <button onClick={clearFilters} className="btn btn-primary">
                Browse All Available Courses
              </button>
            </div>
          ) : (
            <div>
              <div className="grid-3" style={{ gap: '2rem', marginBottom: '3rem' }}>
                {courses.map(course => {
                  const id = course.id || course._id;
                  const price = course.discountPrice !== undefined && course.discountPrice !== null ? course.discountPrice : course.price;
                  const isFree = price === 0 || course.isFree;

                  return (
                    <div key={id} className="course-card card-glass" style={{ display: 'flex', flexDirection: 'column', borderRadius: '14px', overflow: 'hidden' }}>
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'} 
                          alt={course.title} 
                          style={{ width: '100%', height: '190px', objectFit: 'cover' }} 
                        />
                        <span 
                          className="badge badge-primary" 
                          style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                        >
                          {course.level || 'Class 10'}
                        </span>
                        {course.rating && (
                          <span 
                            className="badge badge-warning" 
                            style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ffb703', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <FiStar size={12} fill="#ffb703" /> {course.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem', lineHeight: 1.4 }}>
                          {course.title}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', flex: 1, lineHeight: 1.5 }}>
                          {course.description && course.description.length > 100 
                            ? `${course.description.substring(0, 100)}...` 
                            : course.description}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FiClock /> {course.duration || '6 Months'}
                          </span>
                          {course.enrolledStudents !== undefined && (
                            <span>{course.enrolledStudents} students enrolled</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: isFree ? '#43e97b' : 'var(--primary)', fontSize: '1.3rem' }}>
                              {isFree ? 'Free' : formatPrice(price)}
                            </span>
                            {course.discountPrice && course.price > course.discountPrice && (
                              <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                {formatPrice(course.price)}
                              </span>
                            )}
                          </div>
                          <Link 
                            to={`/courses/${id}`} 
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          >
                            Explore <FiArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary"
                    style={{ opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="btn btn-secondary"
                    style={{ opacity: page >= totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
