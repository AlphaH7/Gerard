/* eslint-disable jsx-a11y/label-has-associated-control */
// @ts-nocheck

import React from 'react';

type IMUAInpurProps = {
  type: string;
  label: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  textarea?: boolean;
  inputCls?: string;
  minDate?: boolean;
  maxDate?: boolean;
};

const AXInput = (props: IMUAInpurProps) => {
  return (
    <div className="input-group relative">
      <label className="absolute -top-2 left-1 bg-white px-1 text-xs">
        {props.label}
      </label>
      {props.textarea ? (
        <textarea
          {...props}
          className={`ax-input dark:bg-slate-950 dark:text-white ax-main-shadow-style ${props.inputCls}`}
        />
      ) : (
        <input
          {...props}
          {...(props.minDate
            ? { min: new Date().toISOString().split('T')[0] }
            : {})}
          {...(props.maxDate
            ? { max: new Date().toISOString().split('T')[0] }
            : {})}
          className={`ax-input dark:bg-slate-950 dark:text-white ax-main-shadow-style ${props.inputCls}`}
        />
      )}
    </div>
  );
};

export default React.memo(AXInput);
