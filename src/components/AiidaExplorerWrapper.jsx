import { useEffect, useState } from "react";
import { AiidaExplorer } from "aiida-explorer";

/**
 * Wrapper component for AiidaExplorer that handles URL parameter synchronization.
 *
 * Reads the rootNode from URL query parameters on mount and updates the URL
 * when the root node changes, enabling shareable links and browser navigation.
 */
export function AiidaExplorerWrapper({ restApiUrl }) {
  const [rootNode, setrootNode] = useState(null);

  useEffect(() => {
    // Read URL params on mount
    const params = new URLSearchParams(window.location.search);
    const node = params.get("uuid");
    setrootNode(node);
    console.log("Selected Node from URL:", node);
  }, []);

  // Update URL when rootNode changes
  useEffect(() => {
    if (rootNode !== null) {
      const url = new URL(window.location);
      if (rootNode) {
        url.searchParams.set("uuid", rootNode);
      } else {
        url.searchParams.delete("uuid");
      }
      // Update URL without reloading the page
      window.history.pushState({}, "", url);
    }
  }, [rootNode]);

  // Listen to browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const node = params.get("uuid");
      setrootNode(node);
      console.log("Browser navigation - Selected Node:", node);
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <AiidaExplorer
      restApiUrl={restApiUrl}
      rootNode={rootNode}
      onRootNodeChange={setrootNode}
      debugMode={false}
    />
  );
}
