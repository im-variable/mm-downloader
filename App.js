import React, { useEffect, useState } from "react";
import { ToastAndroid } from "react-native";
import {
  Text,
  Input,
  View,
  Link,
  HStack,
  Center,
  Heading,
  Switch,
  useColorMode,
  NativeBaseProvider,
  extendTheme,
  VStack,
  Stack,
  Box,
  Image,
  Button,
  Progress,
} from "native-base";

import ytdl from "react-native-ytdl";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import icon from "./assets/getyourtrack-fav.png";
// import { AdMobBanner } from "react-native-google-mobile-ads";

import * as MediaLibrary from "expo-media-library";

// Define the config
const config = {
  useSystemColorMode: false,
  initialColorMode: "dark",
};

// extend the theme
export const theme = extendTheme({ config });

export default function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [url, setUrl] = useState("");
  const [permission, askForPermission] = MediaLibrary.usePermissions();

  const handleChangeUrl = (text) => setUrl(text);

  const downloadBtnHandler = async (e) => {
    if (url) {
      try {
        if (!permission.granted) {
          const { status } = await askForPermission();
          if (status !== "granted") {
            console.log("Permission not granted!");
            return;
          }
        }
        const videoInfo = await ytdl.getInfo(url);
        const videoTitle = videoInfo.videoDetails.title + "[trackdown].mp3";
        const format = ytdl.chooseFormat(videoInfo.formats, {
          quality: "highestaudio",
        });

        const downloadDir = FileSystem.documentDirectory + "trackdown/";
        const fileUri = downloadDir + videoTitle;

        const directoryInfo = await FileSystem.getInfoAsync(downloadDir);
        if (!directoryInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadDir, {
            intermediates: true,
          });
        }
        setIsDownloading(true);
        const file = await FileSystem.createDownloadResumable(
          format.url,
          fileUri,
          {},
          (downloadprocess) => {
            const progress = Math.round(
              (downloadprocess.totalBytesWritten /
                downloadprocess.totalBytesExpectedToWrite) *
                100
            );
            setDownloadProgress(progress);
            console.log(`Download progress: ${progress}`);
          }
        );

        const downloadResult = await file.downloadAsync();

        try {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          const albumName = "trackdown";
          const album = await MediaLibrary.getAlbumAsync(albumName);
          if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        } catch (error) {
          console.log(error);
        }
        setIsDownloading(false);
        ToastAndroid.showWithGravity(
          `"${videoTitle}" has been downloaded.`,
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM
        );
        console.log(`Audio saved to ${videoTitle}`);
      } catch (error) {
        ToastAndroid.showWithGravity(
          "" + error,
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM
        );
        console.error(error);
      } finally {
        setUrl("");
        setDownloadProgress(0);
        setIsDownloading(false);
      }
    }
  };
  return (
    <NativeBaseProvider>
      <Center
        _dark={{ bg: "blueGray.900" }}
        _light={{ bg: "blueGray.50" }}
        px={4}
        flex={1}
      >
        <VStack space={5} alignItems="center">
          {/* <NativeBaseIcon /> */}
          <Heading size="lg">
            <VStack
              space={1}
              justifyContent="center"
              alignItems="center"
              safeAreaTop // my={6}
              mb={2}
            >
              <Image
                borderRadius={10}
                key={"xs"}
                size={50}
                resizeMode="cover"
                source={icon}
                alt={"logo"}
                accessibilityLabel={"logo"}
              />
            </VStack>
          </Heading>
          <HStack space={2} alignItems="center">
            <Input
              variant="underlined"
              placeholder="https://www.youtube.com/watch?v=xxxxxxxxx"
              value={url}
              onChangeText={handleChangeUrl}
              disabled={isDownloading}
            />
          </HStack>
          <HStack space={2} alignItems="center">
            {isDownloading && (
              <Center w="100%">
                <Box w="100%" maxW="400">
                  <Progress value={downloadProgress} mx="4" />
                </Box>
                <Text>{downloadProgress}%</Text>
              </Center>
            )}
          </HStack>
          <Button
            size="sm"
            variant="outline"
            colorScheme="secondary"
            onPress={downloadBtnHandler}
            disabled={isDownloading}
            isLoading={isDownloading}
            isLoadingText="Downloading"
          >
            Download
          </Button>
          <ToggleDarkMode />
          <VStack
            space={1}
            justifyContent="center"
            alignItems="center"
            safeAreaTop // my={6}
            mb={2}
          ></VStack>
        </VStack>

        {/* <AdMobBanner
          adSize="banner"
          adUnitID="ca-app-pub-7734815935340334/3576454759" // Test ID, Replace with your-admob-unit-id
          onAdFailedToLoad={(error) => console.error(error)}
        /> */}
      </Center>
    </NativeBaseProvider>
  );
}

// Color Switch Component
function ToggleDarkMode() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack space={2} alignItems="center">
      <Text>Dark</Text>
      <Switch
        isChecked={colorMode === "light"}
        onToggle={toggleColorMode}
        aria-label={
          colorMode === "light" ? "switch to dark mode" : "switch to light mode"
        }
      />
      <Text>Light</Text>
    </HStack>
  );
}
