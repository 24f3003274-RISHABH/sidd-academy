import React from 'react';

const AboutPage = () => {
  return (
    <div>
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '6rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>About Sidd Academy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Empowering students to achieve their academic goals with top-tier resources and expert guidance.</p>
        </div>
      </section>

      <section className="container" style={{ padding: '5rem 0' }}>
        <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Our Mission</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '1rem' }}>
              At Sidd Academy, we believe that high-quality education should be accessible to everyone. Our mission is to bridge the gap between students and expert educators by providing a platform rich in resources, structured courses, and comprehensive notes.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              We strive to create an engaging learning environment where students can learn at their own pace, test their knowledge, and continuously improve.
            </p>
          </div>
          <div className="card-glass" style={{ padding: '2rem', borderRadius: '16px', background: 'linear-gradient(45deg, rgba(108, 99, 255, 0.1), rgba(255, 101, 132, 0.1))' }}>
            <h3 style={{ marginBottom: '1rem' }}>Our Values</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                <span>Excellence in Education</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }}></div>
                <span>Student-Centric Approach</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
                <span>Innovation in Learning</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }}></div>
                <span>Affordability and Access</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '5rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '3rem' }}>Meet the Founder</h2>
          <div style={{ display: 'inline-block', textAlign: 'center' }}>
            <img src="https://via.placeholder.com/150" alt="Founder" style={{ width: '150px', height: '150px', borderRadius: '50%', marginBottom: '1rem', border: '4px solid var(--primary)' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Siddhant Pandey</h3>
            <p style={{ color: 'var(--text-muted)' }}>Founder & Lead Educator</p>
            <p style={{ maxWidth: '600px', margin: '1rem auto 0 auto', color: 'var(--text-muted)' }}>With over 10 years of experience in education, Siddharth founded Sidd Academy to bring high-quality learning resources to students everywhere.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
