export const profileData = {
  name: 'John Doe',
  title: 'Full-Stack Developer',
  avatar: '/professional-developer-avatar.png',
  email: 'john@example.com',
  phone: '+1 (234) 567-890',
  birthday: 'June 15, 1995',
  location: 'San Francisco, California, USA',
  social: {
    github: 'https://github.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
  },
}

export const aboutData = {
  description: [
    "I'm a Full-Stack Developer from San Francisco, California, specializing in web development and creating innovative digital solutions. I enjoy turning complex problems into simple, beautiful and intuitive applications.",
    "My job is to build your website or application so that it is functional and user-friendly but at the same time attractive. Moreover, I add personal touch to your product and make sure that is eye-catching and easy to use. My aim is to bring across your message and identity in the most creative way. I've worked with various technologies including React, Next.js, Node.js, and modern cloud platforms.",
  ],
  services: [
    {
      icon: 'Code',
      title: 'Frontend Development',
      description: 'Building modern, responsive web applications with React, Next.js, and TypeScript.',
    },
    {
      icon: 'Zap',
      title: 'Backend Development',
      description: 'Creating robust APIs and server-side solutions with Node.js and modern frameworks.',
    },
    {
      icon: 'Smartphone',
      title: 'Mobile Development',
      description: 'Professional development of mobile applications with React Native and modern tools.',
    },
    {
      icon: 'PenTool',
      title: 'UI/UX Design',
      description: 'Designing intuitive and beautiful user interfaces that enhance user experience.',
    },
  ],
  testimonials: [
    {
      avatar: '/professional-man.jpg',
      name: 'Daniel Lewis',
      text: 'John was hired to create a corporate identity. We were very pleased with the work done. He has a lot of experience and is very concerned about the needs of client.',
    },
    {
      avatar: '/professional-woman-diverse.png',
      name: 'Jessica Miller',
      text: 'John was hired to create a corporate identity. We were very pleased with the work done. He has a lot of experience and is very concerned about the needs of client.',
    },
    {
      avatar: '/professional-man.jpg',
      name: 'Michael Chen',
      text: 'Outstanding work! John delivered a high-quality product that exceeded our expectations. His attention to detail is remarkable.',
    },
    {
      avatar: '/professional-woman-diverse.png',
      name: 'Sarah Johnson',
      text: 'Professional, creative, and highly skilled. John is the developer you want on your team for any complex project.',
    },
  ],
  clients: [
    { name: 'TechCorp', logo: '/tech-company-logo.jpg' },
    { name: 'StartupHub', logo: '/startup-logo.png' },
    { name: 'DesignStudio', logo: '/design-agency-logo.png' },
    { name: 'CodeLabs', logo: '/software-company-logo.png' },
    { name: 'WebSolutions', logo: '/web-agency-logo.jpg' },
    { name: 'AppMakers', logo: '/app-development-logo.jpg' },
  ],
}

export const resumeData = {
  education: [
    {
      title: 'University of California, Berkeley',
      period: '2013 — 2017',
      description:
        'Studied Computer Science with a focus on web technologies and software engineering principles.',
    },
    {
      title: 'Frontend Development Bootcamp',
      period: '2017 — 2018',
      description: 'Intensive program covering modern JavaScript frameworks, responsive design, and UX principles.',
    },
  ],
  experience: [
    {
      title: 'Senior Full-Stack Developer',
      period: '2020 — Present',
      description:
        'Leading development of scalable web applications using React, Node.js, and cloud technologies. Mentoring junior developers and implementing best practices.',
    },
    {
      title: 'Full-Stack Developer',
      period: '2018 — 2020',
      description:
        'Developed and maintained multiple client projects using modern web technologies. Collaborated with design teams to create seamless user experiences.',
    },
  ],
  skills: [
    { name: 'Web Design', level: 90 },
    { name: 'Frontend Development', level: 95 },
    { name: 'Backend Development', level: 85 },
    { name: 'Database Design', level: 80 },
  ],
}

export const portfolioData = {
  categories: ['all', 'web design', 'applications', 'web development'],
  projects: [
    {
      title: 'E-Commerce Platform',
      category: 'web development',
      image: '/modern-ecommerce-website.png',
      description: 'Full-stack e-commerce solution with payment integration',
      tech: ['Next.js', 'Node.js', 'PostgreSQL'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/ecommerce',
    },
    {
      title: 'Task Management App',
      category: 'applications',
      image: '/task-management-interface.png',
      description: 'Collaborative task manager with real-time updates',
      tech: ['React', 'Firebase', 'TypeScript'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/taskmanager',
    },
    {
      title: 'Portfolio Website',
      category: 'web design',
      image: '/minimalist-portfolio-design.jpg',
      description: 'Modern portfolio design for creative professionals',
      tech: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/portfolio',
    },
    {
      title: 'Social Media Dashboard',
      category: 'web development',
      image: '/analytics-dashboard.png',
      description: 'Analytics dashboard with data visualization',
      tech: ['React', 'D3.js', 'Express'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/dashboard',
    },
    {
      title: 'Mobile Banking App',
      category: 'applications',
      image: '/banking-app-interface.png',
      description: 'Secure mobile banking application',
      tech: ['React Native', 'Node.js', 'MongoDB'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/banking',
    },
    {
      title: 'Restaurant Website',
      category: 'web design',
      image: '/restaurant-website-design.png',
      description: 'Elegant restaurant website with online ordering',
      tech: ['Next.js', 'Sanity CMS', 'Stripe'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/johndoe/restaurant',
    },
  ],
}

export const blogData = {
  posts: [
    {
      title: 'Building Modern Web Applications with Next.js 15',
      category: 'Development',
      date: 'Mar 15, 2024',
      readTime: '8 min',
      image: '/web-development-coding.png',
      excerpt: 'Deep dive into Next.js 15 features and App Router enhancements.',
      tags: ['Next.js', 'React', 'Web Development'],
      slug: 'building-modern-web-apps-nextjs-15',
    },
    {
      title: 'Microservices Architecture: A Complete Guide',
      category: 'Architecture',
      date: 'Mar 8, 2024',
      readTime: '12 min',
      image: '/software-architecture.jpg',
      excerpt: 'Design scalable microservices with real-world examples.',
      tags: ['Architecture', 'Backend', 'DevOps'],
      slug: 'microservices-architecture-guide',
    },
    {
      title: 'The Art of UI/UX: Creating Delightful Experiences',
      category: 'Design',
      date: 'Feb 28, 2024',
      readTime: '6 min',
      image: '/ui-ux-design-concept.png',
      excerpt: 'Principles of exceptional UI/UX design for interfaces users love.',
      tags: ['Design', 'UI/UX', 'Frontend'],
      slug: 'art-of-uiux-delightful-experiences',
    },
    {
      title: 'TypeScript Best Practices for Large-Scale Applications',
      category: 'Development',
      date: 'Feb 20, 2024',
      readTime: '10 min',
      image: '/web-development-coding.png',
      excerpt: 'Master TypeScript patterns for maintainable, type-safe code.',
      tags: ['TypeScript', 'JavaScript', 'Best Practices'],
      slug: 'typescript-best-practices',
    },
    {
      title: 'Building Real-Time Applications with WebSockets',
      category: 'Development',
      date: 'Feb 12, 2024',
      readTime: '9 min',
      image: '/software-architecture.jpg',
      excerpt: 'Implement real-time features using WebSockets and modern frameworks.',
      tags: ['WebSockets', 'Real-time', 'Backend'],
      slug: 'realtime-apps-websockets',
    },
    {
      title: 'Mastering CSS Grid and Flexbox Layouts',
      category: 'Design',
      date: 'Feb 5, 2024',
      readTime: '7 min',
      image: '/ui-ux-design-concept.png',
      excerpt: 'Modern CSS layout techniques with practical examples.',
      tags: ['CSS', 'Layout', 'Frontend'],
      slug: 'mastering-css-grid-flexbox',
    },
  ],
}

export const contactData = {
  email: 'john@example.com',
  phone: '+1 (234) 567-890',
  location: 'San Francisco, CA',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100940.14220298434!2d-122.50764017406082!3d37.75767381338211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA%2C%20USA!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus',
}
