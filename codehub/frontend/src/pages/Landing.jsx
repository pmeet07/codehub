import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    CommandLineIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    BoltIcon,
    CodeBracketIcon,
    UserGroupIcon,
    ArrowRightIcon,
    StarIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    useEffect(() => {
        if (user) {
            if (user.user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col min-h-screen bg-dark-bg selection:bg-primary-500/30 overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
                {/* Background Gradients */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                    <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-gray-300">v2.0 is now live</span>
                        <span className="mx-2 text-gray-600">|</span>
                        <span className="text-sm text-primary-400 font-semibold flex items-center gap-1">New Features <SparklesIcon className="w-3 h-3" /></span>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 text-white leading-tight"
                    >
                        Powering the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-300% animate-gradient">
                            Future of Software
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
                        CodeHub is the complete developer platform to build, scale, and deliver secure software. Join millions of developers pushing the boundaries.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-lg mx-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/signup')}
                            className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 group"
                        >
                            Sign up free
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="bg-white/5 text-gray-200 border border-white/10 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-white/5 transition-all backdrop-blur-md"
                        >
                            Log in
                        </motion.button>
                    </motion.div>

                    <motion.p variants={itemVariants} className="mt-8 text-sm text-gray-500 flex items-center justify-center gap-6">
                        <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-primary-500" /> No credit card required</span>
                        <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-primary-500" /> 14-day free trial</span>
                    </motion.p>
                </motion.div>
            </div>

            {/* Feature Grid */}
            <div className="py-32 relative bg-dark-bg">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto mb-20"
                    >
                        <h2 className="text-sm font-semibold text-primary-400 tracking-widest uppercase mb-3">Features</h2>
                        <p className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Everything you need to ship
                        </p>
                        <p className="text-xl text-gray-400">
                            Accelerate your workflow with our integrated suite of tools.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -5 }}
                                className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/5 hover:border-primary-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />

                                <div className="p-3 bg-white/5 rounded-2xl w-fit mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-8 h-8 text-primary-400 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats / Trust Section */}
            <div className="py-24 bg-dark-card border-y border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-900/10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { value: '100M+', label: 'Repositories' },
                            { value: '4M+', label: 'Developers' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '24/7', label: 'Support' },
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                                className="flex flex-col gap-2"
                            >
                                <dt className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">{stat.value}</dt>
                                <dd className="text-sm font-medium text-primary-400 uppercase tracking-widest">{stat.label}</dd>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative py-32 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-bg to-accent-900/40"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 hidden md:block"></div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto px-4 text-center z-10"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                        Ready to ship?
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                        Join the world's most innovative companies using CodeHub to build software. Start your journey today.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/signup')}
                        className="bg-white text-dark-bg px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition-all shadow-2xl shadow-white/10"
                    >
                        Create your free account
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
    </svg>
);

const SparklesIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
    </svg>
);

const features = [
    {
        title: 'Unlimited Repositories',
        description: 'Host as many private and public repositories as you need. No limits on creativity.',
        icon: CodeBracketIcon,
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Collaborative Coding',
        description: 'Review code, manage projects, and build software alongside millions of other developers.',
        icon: UserGroupIcon,
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Advanced Security',
        description: 'Keep your code safe with automated security scanning and secret detection.',
        icon: ShieldCheckIcon,
        gradient: 'from-green-500 to-emerald-500'
    },
    {
        title: 'Global Performance',
        description: 'Lightning fast access to your code from anywhere in the world via our edge network.',
        icon: GlobeAltIcon,
        gradient: 'from-orange-500 to-red-500'
    },
    {
        title: 'DevOps Automation',
        description: 'Automate your software workflows with built-in CI/CD pipelines.',
        icon: BoltIcon,
        gradient: 'from-yellow-400 to-orange-500'
    },
    {
        title: 'Developer Tools',
        description: 'Powerful command line tools and API connectivity to fit your workflow.',
        icon: CommandLineIcon,
        gradient: 'from-indigo-500 to-purple-500'
    }
];

export default Landing;
