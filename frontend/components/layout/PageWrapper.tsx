  "use client";

  import { motion } from "framer-motion";
  import { Header } from "./Header";

  interface PageWrapperProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }

  const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };

  export function PageWrapper({ title, subtitle, children }: PageWrapperProps) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <motion.main
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto p-6 scrollable"
          style={{ background: "var(--bg-base)" }}
        >
          {children}
        </motion.main>
      </div>
    );
  }
