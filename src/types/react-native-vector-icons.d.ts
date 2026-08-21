// Local ambient declaration for the one icon set this app actually uses
// (MaterialCommunityIcons), replacing the @types/react-native-vector-icons
// DefinitelyTyped package.
//
// Why: that package transitively pulls in @types/react-native@0.70, a
// pre-"RN ships its own types" (RN < 0.72) style typings package. Having
// both it and RN 0.87's bundled types on the program at once collapses
// StyleSheet.create()'s per-key type inference to a single imprecise
// ViewStyle | TextStyle | ImageStyle union across every key — which broke
// `gap` and <Image style={...}> type-checking throughout the app (see
// LibraryScreen.tsx). Since react-native-vector-icons itself ships no
// types of its own, and this app only ever imports the MaterialCommunityIcons
// icon set, a small local declaration covering just what's actually used
// removes the conflicting dependency instead of patching around it.
declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import * as React from 'react';
  import { ColorValue, TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    size?: number;
    name: string;
    color?: ColorValue | number;
  }

  export default class Icon extends React.Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: ColorValue | number,
    ): Promise<any>;
    static loadFont(file?: string): Promise<void>;
    static hasIcon(name: string): boolean;
  }
}
