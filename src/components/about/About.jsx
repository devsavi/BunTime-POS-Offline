import React from 'react';
import { 
  User, 
  Code, 
  Globe, 
  Shield, 
  Cpu, 
  Heart,
  Star,
  Award,
  BookOpen,
  Zap,
  Database,
  Palette,
  Smartphone,
  Download,
  Monitor,
  Coffee,
  Info
} from 'lucide-react';

const About = () => {
  const technologies = [
    { name: 'React + Vite', icon: '⚛️', description: 'Modern frontend framework' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Utility-first styling' },
    { name: 'Firebase', icon: '🔥', description: 'Backend & Authentication' },
    { name: 'Lucide React', icon: '🎯', description: 'Beautiful icons' }
  ];

  const features = [
    '🔐 Role-based Authentication (Admin, Cashier)',
    '📦 Inventory Management with barcode printing',
    '🛒 Billing System: Discount and multi-payment support',
    '👥 Customer Management',
    '🔁 Returns Workflow and Goods Receive Notes (GRN)',
    '📊 Real-Time Analytics Dashboard',
    '📁 Reports Export (Excel, CSV & PDF)',
    '🌙 Dark/Light Mode',
    '🌐 Multi-language Interface (English, Sinhala, Tamil)',
    '🖨️ Receipt Printing & PDF Downloads',
    '🔔 In-App Notifications',
    '➗ Integrated Calculator'
  ];

  const shopTypes = [
    { name: 'Grocery Stores', icon: '🛒' },
    { name: 'Pharmacies', icon: '💊' },
    { name: 'Hardware Stores', icon: '🔧' },
    { name: 'Restaurants', icon: '🍽️' },
    { name: 'Textile Shops', icon: '👕' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Info className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">About BunTime POS-System</h1>
        <p className="text-xl opacity-90">Multi-Shop Point of Sale (POS) System</p>
      </div>

      {/* Developer Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-4">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About the Programmer</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Savindu Weththasinghe</h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                BSc (Hons) Software Engineering Undergraduate
              </p>
              <p className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                Informatics Institute of Technology (IIT)
              </p>
              <p className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-500" />
                Affiliated with University of Westminster
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Technical Skills</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Firebase', 'JavaScript', 'Node.js', 'Java', 'Unity', 'Tailwind CSS', 'Python', 'Flutter', 'Dart'].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
            
            <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>✨ Experienced in building scalable full-stack applications</p>
              <p>☁️ Expert in cloud-integrated systems</p>
              <p>🎯 Committed to solving real-world challenges</p>
              <p>🌍 Strong interest in multi-language support & UI/UX</p>
            </div>
          </div>
        </div>
        
        {/* <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 italic">
            "Kashero POS-System showcases Savindu's technical capabilities and understanding of modern retail workflows."
          </p>
        </div> */}
      </div>

      {/* System Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-4">
            <Monitor className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Overview</h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          A modern, responsive Point of Sale application built using React, Vite, and Tailwind CSS, 
          with Firebase providing secure backend services. Optimized for multi-language support in 
          Sinhala, Tamil, and English.
        </p>
        
        {/* <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tailored for Various Shop Types:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {shopTypes.map((shop) => (
            <div key={shop.name} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-3xl mb-2">{shop.icon}</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{shop.name}</p>
            </div>
          ))}
        </div> */}
      </div>

      {/* Key Features */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-4">
            <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Key Features</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mr-4">
            <Code className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Technology Stack</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {technologies.map((tech) => (
            <div key={tech.name} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-3xl mb-2">{tech.icon}</div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{tech.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-3 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300"><strong>Backend:</strong> Firebase (Authentication & Firestore)</span>
          </div>
          <div className="flex items-start">
            <Zap className="w-5 h-5 mr-3 text-yellow-500 mt-0.5" />
            <div className="text-gray-700 dark:text-gray-300">
              <strong>Utilities:</strong> Context API, xlsx for Excel, jspdf + html2canvas for PDFs, date-fns for date formatting
            </div>
          </div>
        </div>
      </div>

      {/* Security & Deployment */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Deployment</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Shield className="w-6 h-6 mr-3 text-green-600 dark:text-green-400" />
            <span className="text-gray-700 dark:text-gray-300">Firebase Security Rules for robust data protection</span>
          </div>
          <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Download className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-300">Environment variables for secure deployment</span>
          </div>
          <div className="flex items-start p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Cpu className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">Ready for platforms like Netlify, Vercel, Firebase Hosting, and DigitalOcean</span>
          </div>
        </div>
      </div>

      {/* Developer Message */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-white/20 rounded-full mr-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Message from the Developer</h2>
        </div>
        
        <blockquote className="text-lg italic mb-4 leading-relaxed">
          "As a developer, I believe technology should empower people and simplify their work. 
          BunTime POS-System was built with that goal in mind — to provide a fast, accessible, 
          and reliable tool for shop owners across different industries."
        </blockquote>
        
        <blockquote className="text-lg italic mb-6 leading-relaxed">
          "I hope BunTime POS-System adds value to your business and helps make day-to-day operations 
          smoother and more efficient. If you have feedback, ideas, or custom needs, I'd love to hear them!"
        </blockquote>
        
        <div className="flex items-center">
          <Coffee className="w-6 h-6 mr-3" />
          {/* <span className="text-xl font-semibold">— Savindu Weththasinghe</span> */}
          <span>
            <a 
              href="https://my-portfolio-kappa-ochre.vercel.app/"
              target='_blank'
              rel='noopener noreferrer'
              className='text-xl font-semibold'
              >
              — Savindu Weththasinghe
            </a>
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
        <p className="text-gray-700 dark:text-gray-300">
          For inquiries, feedback, or support, please reach out via:
        </p><br/>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            📞 <span className="font-semibold">Phone:</span>{" "}
            <a
              href="tel:+94742839563"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              +94 74 283 9563
            </a>
          </li>
          <li>
            📧 <span className="font-semibold">Email:</span>{" "}
            <a
              href="mailto:savinduweththasinghe03@gmail.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              savinduweththasinghe03@gmail.com
            </a>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center py-6">
        <p className="text-gray-500 dark:text-gray-400">
          Thank you for using BunTime POS-System! 🚀
        </p>
      </div>
    </div>
  );
};

export default About;
