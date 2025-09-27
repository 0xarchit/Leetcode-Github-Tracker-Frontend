import React from "react";

const SiteFooter: React.FC = () => {
  return (
    <footer className="w-full border-t bg-background text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-xs sm:text-sm">
        Made by
        {" "}
        <a
          href="https://0xarchit.is-a.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline"
        >
          0xArchit
        </a>
        {" "}
        for
        {" "}
        <a
          href="https://glauniversity.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline"
        >
          G.L.A. University
        </a>
      </div>
    </footer>
  );
};

export default SiteFooter;
