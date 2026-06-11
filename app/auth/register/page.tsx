import AuthCard from "@/app/components/auth/AuthCard";
import RegisterForm from "@/app/components/auth/RegisterForm";
// app/auth/register/page.tsx
export default function RegisterPage() {
	return (
		<AuthCard
			title="Create account"
			subtitle="Sign up to upload, publish, and sell your beats."
		>
			<RegisterForm />
		</AuthCard>
	);
}
