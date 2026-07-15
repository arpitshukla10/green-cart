import React from 'react'
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const ResetPassword = () => {
    const { token } = useParams();
    const { axios, navigate } = useAppContext();

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        try {
            setIsSubmitting(true);
            const { data } = await axios.post(`/api/user/reset-password/${token}`, { password });

            if (data.success) {
                toast.success(data.message);
                navigate('/');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='min-h-[70vh] flex items-center justify-center'>
            <form onSubmit={onSubmitHandler} className='w-full max-w-md border border-gray-200 rounded-2xl shadow-sm bg-white p-8 flex flex-col gap-4'>
                <div>
                    <p className='text-2xl font-semibold text-gray-800'>
                        Reset <span className='text-primary'>Password</span>
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                        Enter your new password below.
                    </p>
                </div>

                <div>
                    <p>New Password</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Enter new password'
                        className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary-500'
                        required
                    />
                </div>

                <div>
                    <p>Confirm Password</p>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='Confirm new password'
                        className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary-500'
                        required
                    />
                </div>

                <button disabled={isSubmitting} className='bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer disabled:opacity-70'>
                    {isSubmitting ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    )
}

export default ResetPassword
