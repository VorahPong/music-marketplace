import AuthCard from "@/app/components/auth/AuthCard";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
	return (
		<AuthCard
			title="Welcome back"
			subtitle="Log in to manage your music and purchases."
		>
			<LoginForm />
		</AuthCard>
	);
}
