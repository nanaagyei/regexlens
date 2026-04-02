// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegexState } from "../useRegexState";

describe("useRegexState", () => {
  describe("initialization", () => {
    it("starts with default state", () => {
      const { result } = renderHook(() => useRegexState());
      expect(result.current.state).toEqual({
        pattern: "",
        flags: "g",
        text: "",
        flavor: "javascript",
        comparisonPattern: "",
        comparisonFlags: "",
        explanationMode: "simple",
        selectedTemplate: null,
      });
    });

    it("accepts partial initial state overrides", () => {
      const { result } = renderHook(() =>
        useRegexState({ pattern: "\\d+", flags: "gi" })
      );
      expect(result.current.state.pattern).toBe("\\d+");
      expect(result.current.state.flags).toBe("gi");
      expect(result.current.state.text).toBe("");
    });
  });

  describe("core actions", () => {
    it("setPattern updates pattern", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setPattern("abc"));
      expect(result.current.state.pattern).toBe("abc");
    });

    it("setFlags updates flags", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setFlags("gim"));
      expect(result.current.state.flags).toBe("gim");
    });

    it("toggleFlag adds flag when absent", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.toggleFlag("i"));
      expect(result.current.state.flags).toBe("gi");
    });

    it("toggleFlag removes flag when present", () => {
      const { result } = renderHook(() => useRegexState({ flags: "gi" }));
      act(() => result.current.actions.toggleFlag("i"));
      expect(result.current.state.flags).toBe("g");
    });

    it("setText updates text", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setText("hello world"));
      expect(result.current.state.text).toBe("hello world");
    });
  });

  describe("comparison actions", () => {
    it("setComparisonPattern updates comparisonPattern", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setComparisonPattern("\\w+"));
      expect(result.current.state.comparisonPattern).toBe("\\w+");
    });

    it("setComparisonFlags updates comparisonFlags", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setComparisonFlags("gm"));
      expect(result.current.state.comparisonFlags).toBe("gm");
    });
  });

  describe("explanation mode", () => {
    it("setExplanationMode switches mode", () => {
      const { result } = renderHook(() => useRegexState());
      expect(result.current.state.explanationMode).toBe("simple");

      act(() => result.current.actions.setExplanationMode("technical"));
      expect(result.current.state.explanationMode).toBe("technical");

      act(() => result.current.actions.setExplanationMode("simple"));
      expect(result.current.state.explanationMode).toBe("simple");
    });
  });

  describe("template actions", () => {
    it("applyTemplate sets pattern, flags, text, and selectedTemplate", () => {
      const { result } = renderHook(() => useRegexState());
      act(() =>
        result.current.actions.applyTemplate({
          id: "email",
          name: "Email",
          description: "Email validation",
          pattern: "[^@]+@[^@]+",
          flags: "g",
          text: "user@example.com",
        })
      );

      expect(result.current.state.pattern).toBe("[^@]+@[^@]+");
      expect(result.current.state.flags).toBe("g");
      expect(result.current.state.text).toBe("user@example.com");
      expect(result.current.state.selectedTemplate).toBe("email");
    });

    it("setSelectedTemplate updates selectedTemplate", () => {
      const { result } = renderHook(() => useRegexState());
      act(() => result.current.actions.setSelectedTemplate("phone"));
      expect(result.current.state.selectedTemplate).toBe("phone");

      act(() => result.current.actions.setSelectedTemplate(null));
      expect(result.current.state.selectedTemplate).toBeNull();
    });
  });

  describe("reset", () => {
    it("resets all fields to defaults including new fields", () => {
      const { result } = renderHook(() => useRegexState());

      // Modify everything
      act(() => {
        result.current.actions.setPattern("test");
        result.current.actions.setText("sample");
        result.current.actions.setComparisonPattern("compare");
        result.current.actions.setComparisonFlags("gi");
        result.current.actions.setExplanationMode("technical");
        result.current.actions.setSelectedTemplate("email");
      });

      act(() => result.current.actions.reset());

      expect(result.current.state).toEqual({
        pattern: "",
        flags: "g",
        text: "",
        flavor: "javascript",
        comparisonPattern: "",
        comparisonFlags: "",
        explanationMode: "simple",
        selectedTemplate: null,
      });
    });
  });
});
