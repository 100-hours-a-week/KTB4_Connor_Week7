import { Component, createRef } from "react";

class RouteErrorBoundary extends Component {
  state = { error: null };
  headingRef = createRef();

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {
    this.headingRef.current?.focus();
  }

  render() {
    if (this.state.error) {
      return (
        <main>
          <h1 ref={this.headingRef} tabIndex={-1}>
            화면을 표시하지 못했어요.
          </h1>
          <a href="/">처음으로 돌아가기</a>
        </main>
      );
    }

    return this.props.children;
  }
}

export { RouteErrorBoundary };
