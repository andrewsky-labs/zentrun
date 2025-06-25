# Zentrun App Core Community

This folder contains placeholder implementations of the components and functionality provided by the `zentrun-app-core` module. It serves as a fallback when the actual `zentrun-app-core` module is not available.

## Purpose

The Vue build process requires all imported modules to be available at build time, even if they are conditionally imported at runtime. This folder provides empty implementations of the components and functionality that would normally be provided by the `zentrun-app-core` module, allowing the application to build and run without errors when the actual module is not available.

## Components

The following components are provided as placeholders:

- `ZentrunLLMUsage.vue`: A placeholder for the LLM usage component
- `ZentrunLLMPricingPlan.vue`: A placeholder for the LLM pricing plan component
- `ZentrunSeatPricingPlan.vue`: A placeholder for the seat pricing plan component

## Usage

The application code checks for the availability of the `zentrun-app-core` module at runtime and falls back to using these placeholder components if it's not available. This allows the application to run without errors, displaying appropriate messages to the user when the full functionality is not available.

## Implementation Details

Each placeholder component displays a message indicating that the feature is not available in the community version. The components accept the same props and emit the same events as their full-featured counterparts to ensure compatibility.
