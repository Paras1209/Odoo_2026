import React from 'react';
import {
  Box,
  Divider,
  MenuItem,
  Paper,
  Popper,
} from '@mui/material';
import { useClickAwayListener, useHover, useRootRef } from '@mui-base/utils';

interface MenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Menu: React.FC<MenuProps> = ({ anchorEl, open, onClose, children }) => {
  const [anchorElState, setAnchorElState] = React.useState<HTMLElement | null>(anchorEl);
  const [anchorPosition, setAnchorPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    setAnchorElState(anchorEl);
  }, [anchorEl]);

  React.useEffect(() => {
    if (anchorElState) {
      const rect = anchorElState.getBoundingClientRect();
      setAnchorPosition({
        top: rect.bottom + window.pageYOffset,
        left: rect.left + window.pageXOffset
      });
    }
  }, [anchorElState]);

  const handleRequestClose = () => {
    if (onClose) onClose();
  };

  const handleClickAway = () => {
    handleRequestClose();
  };

  useClickAwayListener(() => {
    handleClickAway();
  }, [anchorElState]);

  if (!anchorElState || !open) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorElState}
      placement="bottom-start"
      transition
      disablePortal
    >
      {({ TransitionProps, placement }) => (
        <div
          role="presentation"
          onMouseLeave={handleRequestClose}
          {...TransitionProps}
        >
          <Paper
            elevation={8}
            sx={{
              width: 200,
              '&:focusVisible': {
                outline: '2px solid currentcolor',
              },
            }}
          >
            <Box
              component="div"
              sx={{
                py: 1.5,
                outline: 0,
              }}
            >
              {children}
            </Box>
          </Paper>
        </div>
      )}
    </Popper>
  );
};

export default Menu;