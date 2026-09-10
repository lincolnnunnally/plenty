import { signOutAction } from "@/lib/auth/sign-out-action";

export function SignOutForm({
  className,
  buttonClassName,
  label = "Sign out"
}: {
  className?: string;
  buttonClassName?: string;
  label?: string;
}) {
  return (
    <form className={className} action={signOutAction}>
      <button className={buttonClassName || "button"} type="submit">
        {label}
      </button>
    </form>
  );
}
