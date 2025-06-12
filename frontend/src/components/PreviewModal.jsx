import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  CssBaseline,
  useMediaQuery,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import * as MaterialUI from '@mui/material';
import * as MaterialUIIcons from '@mui/icons-material';
import {
  createTheme,
  ThemeProvider,
  styled,
} from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Preprocess code to normalize icon names and prepare for react-live
const prepareCode = (code) => {
  let normalizedCode = code;

  // Remove all import statements (single-line and multi-line)
  normalizedCode = normalizedCode.replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"];?\s*\n?/g, '');

  // Remove export default statement
  normalizedCode = normalizedCode.replace(/export\s+default\s+/, '');

  const iconMappings = {
    ArrowBackIosIcon: 'ArrowBackIos',
    KeyboardArrowLeftIcon: 'KeyboardArrowLeft',
    KeyboardArrowRightIcon: 'KeyboardArrowRight',
    MenuIcon: 'Menu',
    SearchIcon: 'Search',
    CloseIcon: 'Close',
    AccountCircleIcon: 'AccountCircle',
    PaymentIcon: 'Payment',
    HomeIcon: 'Home',
    FitnessCenterIcon: 'FitnessCenter',
    MessageIcon: 'Message',
    Brightness4Icon: 'Brightness4',
    Brightness7Icon: 'Brightness7',
    DirectionsRunIcon: 'DirectionsRun',
    CreditCardIcon: 'CreditCard',
    ChatBubbleIcon: 'ChatBubble',
    BarChartIcon: 'BarChart',
    SignalCellularAltIcon: 'SignalCellularAlt',
    WifiIcon: 'Wifi',
    BatteryFullIcon: 'BatteryFull',
    LocalTaxiIcon: 'LocalTaxi',
    FastfoodIcon: 'Fastfood',
    ShoppingCartIcon: 'ShoppingCart',
    DeliveryDiningIcon: 'DeliveryDining',
    RestaurantIcon: 'Restaurant',
    ShoppingBasketIcon: 'ShoppingBasket',
    ArrowForwardIosIcon: 'ArrowForwardIos',
    Brightness4: 'Brightness4',
    Brightness7: 'Brightness7',
  };

  Object.entries(iconMappings).forEach(([incorrect, correct]) => {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'g');
    normalizedCode = normalizedCode.replace(regex, correct);
  });

  // Clean up extra whitespace and newlines
  normalizedCode = normalizedCode.replace(/\n\s*\n+/g, '\n').trim();

  console.log('Normalized code:', normalizedCode); // Debug

  // For noInline={true}, we need to call render() instead of return
  const wrappedCode = `
    ${normalizedCode}

    render(<GeneratedComponent />);
  `;

  return wrappedCode;
};

const PreviewModal = ({ open, onClose, code, deviceType }) => {
  const scope = {
    React,
    useState,
    useEffect,
    useCallback,
    useMediaQuery,
    render: (element) => element,
    ...MaterialUI,
    ...MaterialUIIcons,
    createTheme,
    ThemeProvider,
    styled,
    CssBaseline,
    DragDropContext,
    Droppable,
    Draggable,
    ArrowBackIos: MaterialUIIcons.ArrowBackIos,
    KeyboardArrowLeft: MaterialUIIcons.KeyboardArrowLeft,
    KeyboardArrowRight: MaterialUIIcons.KeyboardArrowRight,
    Menu: MaterialUIIcons.Menu,
    Search: MaterialUIIcons.Search,
    Close: MaterialUIIcons.Close,
    AccountCircle: MaterialUIIcons.AccountCircle,
    Payment: MaterialUIIcons.Payment,
    Home: MaterialUIIcons.Home,
    FitnessCenter: MaterialUIIcons.FitnessCenter,
    Message: MaterialUIIcons.Message,
    Brightness4: MaterialUIIcons.Brightness4,
    Brightness7: MaterialUIIcons.Brightness7,
    DirectionsRun: MaterialUIIcons.DirectionsRun,
    CreditCard: MaterialUIIcons.CreditCard,
    ChatBubble: MaterialUIIcons.ChatBubble,
    BarChart: MaterialUIIcons.BarChart,
    SignalCellularAlt: MaterialUIIcons.SignalCellularAlt,
    Wifi: MaterialUIIcons.Wifi,
    BatteryFull: MaterialUIIcons.BatteryFull,
    LocalTaxi: MaterialUIIcons.LocalTaxi,
    Fastfood: MaterialUIIcons.Fastfood,
    ShoppingCart: MaterialUIIcons.ShoppingCart,
    DeliveryDining: MaterialUIIcons.DeliveryDining,
    Restaurant: MaterialUIIcons.Restaurant,
    ShoppingBasket: MaterialUIIcons.ShoppingBasket,
    ArrowForwardIos: MaterialUIIcons.ArrowForwardIos,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Live Preview ({deviceType})
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '1px solid #ccc',
            p: 2,
            bgcolor: 'background.paper',
            maxWidth: deviceType === 'desktop' ? '1200px' : '375px',
            mx: 'auto',
            minHeight: '400px',
          }}
        >
          <LiveProvider code={prepareCode(code)} scope={scope} noInline={true}>
            <LivePreview />
            <LiveError style={{ color: 'red', marginTop: '1rem' }} />
          </LiveProvider>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal;