import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "./context/Context";
import { Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";

const Auth = () => {
    const contextValue = useContext(Context);

    if (!contextValue) {
        return <div>Loading...</div>;
    }

    const { login, register } = contextValue;
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        let result;

        if (isLogin) {
            result = await login(formData.email, formData.password);
        } else {
            result = await register(
                formData.username,
                formData.email,
                formData.password
            );
        }

        setIsLoading(false);

        if (result.success) {
            navigate("/");
        } else {
            setError(result.message);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setFormData({ username: "", email: "", password: "" });
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            {/* Main Container - Centered */}
            <div className="w-full max-w-md pt-12 relative z-10">
                {/* Card */}
                <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="text-purple-400" size={28} />
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Council
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm">
                            {isLogin ? "Welcome back" : "Join us"}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 animate-fadeIn">
                            <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                        {/* Username Field (Register Only) */}
                        {!isLogin && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition">
                                    <User size={20} />
                                </div>
                                <input
                                    name="username"
                                    placeholder="Choose username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition"
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition">
                                <Mail size={20} />
                            </div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-400 transition">
                                <Lock size={20} />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full pl-10 pr-10 py-3 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/20 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {isLogin ? "Logging in..." : "Creating account..."}
                                </span>
                            ) : (
                                isLogin ? "Login" : "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-slate-700"></div>
                        <span className="text-slate-400 text-xs">OR</span>
                        <div className="flex-1 h-px bg-slate-700"></div>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={toggleMode}
                        className="w-full py-3 border border-slate-600 hover:border-slate-500 text-slate-300 font-semibold rounded-lg transition duration-300 hover:bg-slate-700/30"
                    >
                        {isLogin ? "Don't have account? Register" : "Already have account? Login"}
                    </button>

                    {/* Footer */}
                    <p className="text-slate-500 text-xs text-center mt-6">
                        By continuing, you agree to our Terms of Service
                    </p>
                </div>

                {/* Info Cards */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 backdrop-blur border border-slate-700/30 rounded-lg p-4 text-center hover:bg-slate-800/60 transition">
                        <div className="text-2xl font-bold text-purple-400 mb-1">AI</div>
                        <p className="text-slate-400 text-xs">Powered by LLM</p>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur border border-slate-700/30 rounded-lg p-4 text-center hover:bg-slate-800/60 transition">
                        <div className="text-2xl font-bold text-blue-400 mb-1">⚡</div>
                        <p className="text-slate-400 text-xs">Ultra Fast</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Auth;