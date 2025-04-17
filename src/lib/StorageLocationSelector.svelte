<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { getStorageLocation, setStorageLocation } from "./utils/storage";

  export let onLocationUpdate: () => void = () => {};

  let currentLocation = "";
  let isLoading = false;
  let errorMessage = "";

  // Load the current location when component mounts
  async function loadCurrentLocation() {
    try {
      isLoading = true;
      currentLocation = await getStorageLocation();
    } catch (error) {
      errorMessage = `Failed to get current location: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Failed to get storage location:", error);
    } finally {
      isLoading = false;
    }
  }

  // Open folder selection dialog
  async function selectFolder() {
    try {
      isLoading = true;
      errorMessage = "";

      // Open a directory selection dialog
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select storage location",
      });

      // If user selected a directory (not cancelled)
      if (selected && typeof selected === "string") {
        await setStorageLocation(selected);
        currentLocation = selected;
        onLocationUpdate(); // Notify parent component that location changed
      }
    } catch (error) {
      errorMessage = `Failed to select folder: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Failed to select storage folder:", error);
    } finally {
      isLoading = false;
    }
  }

  // Call loadCurrentLocation when the component mounts
  import { onMount } from "svelte";
  onMount(() => {
    loadCurrentLocation();
  });
</script>

<div class="storage-location">
  <h3><i class="icon">📂</i> Storage Location</h3>

  {#if isLoading}
    <div class="loading-indicator">
      <div class="spinner-small"></div>
      <span>Loading...</span>
    </div>
  {:else}
    <div class="location-display" title={currentLocation}>
      <i class="icon location-icon">{currentLocation ? "📁" : "📂"}</i>
      <span class="location-text">
        {currentLocation || "Default location"}
      </span>
    </div>
    <button
      class="btn btn-primary btn-sm"
      on:click={selectFolder}
      disabled={isLoading}
    >
      <i class="icon">📂</i> Choose Location
    </button>
  {/if}

  {#if errorMessage}
    <div class="error-message">
      <i class="icon">⚠️</i>
      {errorMessage}
    </div>
  {/if}
</div>

<style>
  .storage-location {
    background-color: white;
    padding: 1rem;
    border-radius: var(--border-radius);
    font-size: 0.9rem;
  }

  h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .location-display {
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: #f8f9fa;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: flex;
    align-items: center;
  }

  .location-icon {
    margin-right: 0.5rem;
    opacity: 0.7;
  }

  .location-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .error-message {
    margin-top: 0.75rem;
    color: var(--error-color);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-light);
    font-style: italic;
    margin-bottom: 0.75rem;
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #f3f3f3;
    border-top: 2px solid var(--primary-color);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .icon {
    font-size: 1em;
  }
</style>
